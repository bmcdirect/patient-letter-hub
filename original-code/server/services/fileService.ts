import { db } from "../db";
import { projectFiles, orderFiles, type ProjectFile, type InsertProjectFile } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { storage } from "../storage";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export class FileService {
  private uploadsDir = "./uploads";
  private projectFilesDir = path.join(this.uploadsDir, "project-files");

  constructor() {
    // Ensure upload directories exist
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.projectFilesDir, { recursive: true });
      
      // Create category subdirectories
      const categories = ['artwork', 'data_files', 'postal_docs'];
      for (const category of categories) {
        await fs.mkdir(path.join(this.projectFilesDir, category), { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to initialize file directories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all project files for an order
  async getOrderProjectFiles(orderId: number): Promise<ProjectFile[]> {
    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.orderId, orderId))
      .orderBy(desc(projectFiles.createdAt));
    
    return files;
  }

  // Get project files by category for an order
  async getOrderProjectFilesByCategory(orderId: number, category: string): Promise<ProjectFile[]> {
    const files = await db
      .select()
      .from(projectFiles)
      .where(and(
        eq(projectFiles.orderId, orderId),
        eq(projectFiles.fileCategory, category)
      ))
      .orderBy(desc(projectFiles.version), desc(projectFiles.createdAt));
    
    return files;
  }

  // Upload a new project file
  async uploadProjectFile(
    orderId: number,
    userId: string,
    uploadedBy: string,
    file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
    metadata: {
      category: 'artwork' | 'data_files' | 'postal_docs';
      fileType?: string;
      description?: string;
      accessLevel?: 'admin' | 'customer' | 'practice';
    }
  ): Promise<ProjectFile> {
    // Get order to access tenant context
    const order = await storage.getOrder(orderId, 1); // Default tenant for now
    if (!order) {
      throw new Error('Order not found');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${orderId}_${metadata.category}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${fileExtension}`;
    
    // Get next version number for artwork files
    let version = 1;
    if (metadata.category === 'artwork') {
      const existingFiles = await this.getOrderProjectFilesByCategory(orderId, 'artwork');
      const maxVersion = existingFiles.reduce((max, f) => Math.max(max, f.version || 0), 0);
      version = maxVersion + 1;
    }

    // Create file path
    const relativePath = path.join('project-files', metadata.category, fileName);
    const fullPath = path.join(this.uploadsDir, relativePath);

    // Save file to disk
    await fs.writeFile(fullPath, file.buffer);

    // Save file metadata to database
    const fileData: InsertProjectFile = {
      tenantId: order.tenantId,
      orderId,
      userId,
      fileName,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileCategory: metadata.category,
      fileType: metadata.fileType || null,
      version,
      filePath: relativePath,
      uploadedBy,
      accessLevel: metadata.accessLevel || 'admin',
      description: metadata.description || null,
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalPath: file.originalname,
      },
    };

    const [savedFile] = await db
      .insert(projectFiles)
      .values(fileData)
      .returning();

    return savedFile;
  }

  // Download an order file
  async downloadOrderFile(fileId: number, userId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const [file] = await db
      .select()
      .from(orderFiles)
      .where(eq(orderFiles.id, fileId));

    if (!file) {
      throw new Error("File not found");
    }

    // Remove leading slash and 'uploads/' from filePath if present
    const cleanPath = file.filePath.replace(/^\/?(uploads\/)?/, '');
    const fullPath = path.join(this.uploadsDir, cleanPath);
    
    // Check if file exists on disk
    try {
      await fs.access(fullPath);
    } catch (error) {
      throw new Error(`File not found on disk: ${(error as Error).message}`);
    }

    return {
      filePath: fullPath,
      fileName: file.originalName,
      mimeType: 'application/octet-stream', // orderFiles doesn't have mimeType field
    };
  }

  // Download a project file
  async downloadProjectFile(fileId: number, userId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId));

    if (!file) {
      throw new Error("File not found");
    }

    // Check access permissions (basic implementation)
    if (file.accessLevel === 'admin' && userId !== file.uploadedBy) {
      // In a real implementation, you'd check if the user is an admin
      // For now, we'll allow access
    }

    // Remove leading slash and 'uploads/' from filePath if present
    const cleanPath = file.filePath.replace(/^\/?(uploads\/)?/, '');
    const fullPath = path.join(this.uploadsDir, cleanPath);
    
    // Check if file exists on disk
    try {
      await fs.access(fullPath);
    } catch (error) {
      throw new Error(`File not found on disk: ${(error as Error).message}`);
    }

    return {
      filePath: fullPath,
      fileName: file.originalName,
      mimeType: file.mimeType || 'application/octet-stream',
    };
  }

  // Delete a project file
  async deleteProjectFile(fileId: number, userId: string): Promise<void> {
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId));

    if (!file) {
      throw new Error("File not found");
    }

    // Check permissions (admin or file uploader)
    if (file.uploadedBy !== userId) {
      // In production, add proper admin role check
      throw new Error("Unauthorized to delete this file");
    }

    // Delete file from disk
    const fullPath = path.join(this.uploadsDir, file.filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error("Failed to delete file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db
      .delete(projectFiles)
      .where(eq(projectFiles.id, fileId));
  }

  // Approve an artwork file (for proofs)
  async approveArtworkFile(fileId: number, approvedBy: string): Promise<ProjectFile> {
    const [updatedFile] = await db
      .update(projectFiles)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projectFiles.id, fileId))
      .returning();

    if (!updatedFile) {
      throw new Error("File not found");
    }

    return updatedFile;
  }

  // Copy approved proof to artwork folder (automatic archival)
  async archiveApprovedProof(proofFileId: number, orderId: number, userId: string): Promise<ProjectFile> {
    const [proofFile] = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, proofFileId));

    if (!proofFile || !proofFile.isApproved) {
      throw new Error("Proof file not found or not approved");
    }

    // Read the original file
    const originalPath = path.join(this.uploadsDir, proofFile.filePath);
    const fileBuffer = await fs.readFile(originalPath);

    // Create archived copy in artwork folder
    const archivedFile = await this.uploadProjectFile(
      orderId,
      userId,
      userId, // archived by the system/user
      {
        originalname: `APPROVED_${proofFile.originalName}`,
        buffer: fileBuffer,
        mimetype: proofFile.mimeType || 'application/octet-stream',
        size: proofFile.fileSize,
      },
      {
        category: 'artwork',
        fileType: 'final_artwork',
        description: `Archived approved proof from ${proofFile.originalName}`,
        accessLevel: 'admin',
      }
    );

    return archivedFile;
  }

  // Get file statistics for an order
  async getOrderFileStats(orderId: number): Promise<{
    artworkFiles: number;
    dataFiles: number;
    postalDocs: number;
    totalSize: number;
    approvedFiles: number;
  }> {
    const files = await this.getOrderProjectFiles(orderId);
    
    const stats = {
      artworkFiles: files.filter(f => f.fileCategory === 'artwork').length,
      dataFiles: files.filter(f => f.fileCategory === 'data_files').length,
      postalDocs: files.filter(f => f.fileCategory === 'postal_docs').length,
      totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
      approvedFiles: files.filter(f => f.isApproved).length,
    };

    return stats;
  }

  // Get allowed file types by category
  getAllowedFileTypes(category: string): string[] {
    const allowedTypes: Record<string, string[]> = {
      artwork: ['.pdf', '.ai', '.eps', '.png', '.jpg', '.jpeg', '.tiff', '.psd'],
      data_files: ['.csv', '.xlsx', '.xls', '.txt', '.json', '.xml'],
      postal_docs: ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'],
    };

    return allowedTypes[category] || [];
  }

  // Validate file upload
  validateFileUpload(file: any, category: string): { valid: boolean; error?: string } {
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = this.getAllowedFileTypes(category);
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (file.size > maxFileSize) {
      return { valid: false, error: "File size exceeds 50MB limit" };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
      return { valid: false, error: `File type ${fileExtension} not allowed for ${category}` };
    }

    return { valid: true };
  }
}

export const fileService = new FileService();