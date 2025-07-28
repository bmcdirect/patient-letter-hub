import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PracticeCard } from "@/components/practice/practice-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Practice } from "@shared/schema";

export default function Locations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Practice | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mainAddress: "",
    city: "",
    state: "",
    zipCode: "",
    npiNumber: "",
    isPrimary: false
  });

  const { data: locations, isLoading } = useQuery({
    queryKey: ["/api/practices/1/locations"],
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: typeof formData) => {
      // Map frontend field names to backend field names
      const backendData = {
        label: locationData.name,
        contactName: locationData.name,
        phone: locationData.phone,
        email: locationData.email,
        addressLine1: locationData.mainAddress,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        isPrimary: locationData.isPrimary
      };
      // For now, use practice ID 1 as default - this should be dynamic based on selected practice
      await apiRequest("POST", "/api/practices/1/locations", backendData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practices/1/locations"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: { id: number } & typeof formData) => {
      // Map frontend field names to backend field names
      const backendData = {
        label: locationData.name,
        contactName: locationData.name,
        phone: locationData.phone,
        email: locationData.email,
        addressLine1: locationData.mainAddress,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        isPrimary: locationData.isPrimary
      };
      // For now, use practice ID 1 as default - this should be dynamic based on selected practice
      await apiRequest("PUT", `/api/practices/1/locations/${id}`, backendData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practices/1/locations"] });
      setShowEditModal(false);
      resetForm();
      setSelectedLocation(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      // For now, use practice ID 1 as default - this should be dynamic based on selected practice
      await apiRequest("DELETE", `/api/practices/1/locations/${locationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practices/1/locations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      mainAddress: "",
      city: "",
      state: "",
      zipCode: "",
      npiNumber: "",
      isPrimary: false
    });
  };

  const populateEditForm = (location: Practice) => {
    setFormData({
      name: location.name || "",
      email: location.email || "",
      phone: location.phone || "",
      mainAddress: location.mainAddress || "",
      city: location.city || "",
      state: location.state || "",
      zipCode: location.zipCode || "",
      npiNumber: location.npiNumber || "",
      isPrimary: false // TODO: Add isPrimary field to schema
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (showEditModal && selectedLocation) {
      updateLocationMutation.mutate({ id: selectedLocation.id, ...formData });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  const handleEditLocation = (location: Practice) => {
    setSelectedLocation(location);
    populateEditForm(location);
    setShowEditModal(true);
  };

  const handleViewDetails = (location: Practice) => {
    setSelectedLocation(location);
    setShowDetailsModal(true);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSwitchChange = (field: keyof typeof formData) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
                <p className="text-gray-600">Manage location information and practice sites</p>
              </div>
              <Button 
                className="bg-primary-500 hover:bg-primary-600 text-white flex items-center space-x-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add Location</span>
              </Button>
            </div>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {locations?.map((location) => (
              <PracticeCard
                key={location.id}
                practice={location}
                onEdit={() => handleEditLocation(location)}
                onDelete={(id) => deleteLocationMutation.mutate(id)}
                onViewDetails={() => handleViewDetails(location)}
              />
            ))}
          </div>

          {locations?.length === 0 && (
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <h3 className="text-lg font-medium mb-2">No locations found</h3>
                  <p className="text-sm mb-4">Get started by adding your first location</p>
                  <Button 
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Add Location Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="npiNumber">NPI Number</Label>
                  <Input
                    id="npiNumber"
                    value={formData.npiNumber}
                    onChange={handleInputChange("npiNumber")}
                    placeholder="Enter NPI number"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mainAddress">Street Address</Label>
                  <Input
                    id="mainAddress"
                    value={formData.mainAddress}
                    onChange={handleInputChange("mainAddress")}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange("city")}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange("state")}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange("zipCode")}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Settings - Primary Location Toggle */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location Settings</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onCheckedChange={handleSwitchChange("isPrimary")}
                />
                <Label htmlFor="isPrimary">Set as primary location</Label>
              </div>
              <p className="text-sm text-gray-500">
                Primary locations are used as the default for new quotes and orders.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                disabled={createLocationMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLocationMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {createLocationMutation.isPending ? "Creating..." : "Create Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Location Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-npiNumber">NPI Number</Label>
                  <Input
                    id="edit-npiNumber"
                    value={formData.npiNumber}
                    onChange={handleInputChange("npiNumber")}
                    placeholder="Enter NPI number"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-mainAddress">Street Address</Label>
                  <Input
                    id="edit-mainAddress"
                    value={formData.mainAddress}
                    onChange={handleInputChange("mainAddress")}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={formData.city}
                      onChange={handleInputChange("city")}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={formData.state}
                      onChange={handleInputChange("state")}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-zipCode">Zip Code</Label>
                    <Input
                      id="edit-zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange("zipCode")}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setSelectedLocation(null);
                }}
                disabled={updateLocationMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateLocationMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
          </DialogHeader>
          
          {selectedLocation && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Location Name</Label>
                  <p className="text-lg font-semibold text-primary-blue">{selectedLocation.name}</p>
                </div>
                {selectedLocation.npiNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">NPI Number</Label>
                    <p className="mt-1">{selectedLocation.npiNumber}</p>
                  </div>
                )}
              </div>

              {(selectedLocation.email || selectedLocation.phone) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLocation.email && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <p className="mt-1">{selectedLocation.email}</p>
                      </div>
                    )}
                    {selectedLocation.phone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Phone</Label>
                        <p className="mt-1">{selectedLocation.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedLocation.mainAddress || selectedLocation.city || selectedLocation.state || selectedLocation.zipCode) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Address</h3>
                  <div className="text-gray-700">
                    {selectedLocation.mainAddress && <p>{selectedLocation.mainAddress}</p>}
                    {(selectedLocation.city || selectedLocation.state || selectedLocation.zipCode) && (
                      <p>
                        {[selectedLocation.city, selectedLocation.state, selectedLocation.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p className="mt-1">
                      {fmtDate(selectedLocation.createdAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                    <p className="mt-1">
                      {fmtDate(selectedLocation.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditLocation(selectedLocation);
                  }}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Edit Location
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
