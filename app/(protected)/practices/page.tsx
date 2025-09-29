"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  RefreshCw, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Users,
  Eye,
  Edit,
  Plus
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";

export default function PracticesPage() {
  const [practices, setPractices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPractices();
  }, []);

  const fetchPractices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/practices");
      if (!response.ok) {
        throw new Error('Failed to fetch practices');
      }
      const data = await response.json();
      setPractices(data.practices || []);
    } catch (error) {
      console.error('Error fetching practices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPractices = practices.filter(practice =>
    practice.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    practice.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    practice.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPracticeStats = () => {
    return {
      total: practices.length,
      active: practices.filter(p => p.status === 'active').length,
      inactive: practices.filter(p => p.status === 'inactive').length,
    };
  };

  const stats = getPracticeStats();

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Practices"
          text="Manage practice information and settings."
        />
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading practices...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        heading="Practices"
        text="Manage practice information and settings."
      />

      {/* Practice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered practices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Practices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active practices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Practices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Inactive or suspended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Practice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search practices..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={fetchPractices} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Practice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Practices Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Practices ({filteredPractices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPractices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No practices found matching your search.' : 'No practices registered yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Practice Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractices.map((practice) => (
                  <TableRow key={practice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {practice.name || 'Unnamed Practice'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {practice.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-2" />
                            {practice.email}
                          </div>
                        )}
                        {practice.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-2" />
                            {practice.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          {practice.address && (
                            <div>{practice.address}</div>
                          )}
                          {practice.city && practice.state && (
                            <div>{practice.city}, {practice.state} {practice.zipCode}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={practice.status === 'active' ? 'default' : 'secondary'}
                        className={
                          practice.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {practice.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
} 