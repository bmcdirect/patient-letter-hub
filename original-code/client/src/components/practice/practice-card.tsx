import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, MapPin, Hash, Edit, Trash2 } from "lucide-react";
import type { Practice } from "@shared/schema";

interface PracticeCardProps {
  practice: Practice;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function PracticeCard({ practice, onEdit, onDelete, onViewDetails }: PracticeCardProps) {
  const getColorVariant = (index: number) => {
    const variants = [
      'bg-primary-100 text-primary-600',
      'bg-secondary-100 text-secondary-600',
      'bg-accent-100 text-accent-600',
      'bg-green-100 text-green-600'
    ];
    return variants[index % variants.length];
  };

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center mr-4 ${getColorVariant(practice.id)}`}>
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{practice.name}</h3>
              <p className="text-sm text-gray-500">Healthcare Location</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(practice.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(practice.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {practice.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              <span>{practice.email}</span>
            </div>
          )}
          {practice.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              <span>{practice.phone}</span>
            </div>
          )}
          {(practice.mainAddress || practice.city || practice.state || practice.zipCode) && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {[practice.mainAddress, practice.city, practice.state, practice.zipCode]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          {practice.npiNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <Hash className="h-4 w-4 mr-2" />
              <span>NPI: {practice.npiNumber}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span>Active practice</span>
            </div>
            <Button variant="link" onClick={() => onViewDetails(practice.id)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
