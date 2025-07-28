import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPracticeSchema, insertPracticeLocationSchema } from '../../shared/schema';

export async function list(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const practices = await storage.getPracticesByTenant(tenantId);
    res.json(practices);
  } catch (error) {
    console.error('Error listing practices:', error);
    res.status(500).json({ error: 'Failed to list practices' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const practiceData = insertPracticeSchema.parse({
      ...req.body,
      tenantId
    });
    
    const practice = await storage.createPractice(practiceData);
    res.status(201).json(practice);
  } catch (error) {
    console.error('Error creating practice:', error);
    res.status(500).json({ error: 'Failed to create practice' });
  }
}

// Location management functions
export async function getLocations(practiceId: number, tenantId: number) {
  return await storage.getPracticeLocations(practiceId, tenantId);
}

export async function createLocation(practiceId: number, tenantId: number, locationData: any) {
  // Map frontend field names to backend field names and validate
  const data = insertPracticeLocationSchema.parse({
    tenantId,
    practiceId,
    label: locationData.label,
    contactName: locationData.contactName,
    phone: locationData.phone,
    email: locationData.email,
    addressLine1: locationData.addressLine1,
    city: locationData.city,
    state: locationData.state,
    zipCode: locationData.zipCode,
    isDefault: locationData.isPrimary === true || locationData.isPrimary === "true" ? 1 : 0
  });
  
  return await storage.createPracticeLocation(data);
}