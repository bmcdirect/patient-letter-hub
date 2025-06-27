import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, LogOut } from "lucide-react";

interface HeaderProps {
  user: any;
  practices: any[];
  selectedPractice: any;
}

export default function Header({ user, practices, selectedPractice }: HeaderProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-primary-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6" />
              <h1 className="text-xl font-bold">PatientLetterHub</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Customer Name */}
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">
              <span className="opacity-80">Customer:</span>
              <span className="font-semibold ml-1">
                {selectedPractice?.contact_prefix} {selectedPractice?.contact_first_name} {selectedPractice?.contact_last_name} {selectedPractice?.contact_suffix} 
                {selectedPractice?.name && ` - ${selectedPractice.name}`}
              </span>
            </div>
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-white/10">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'User'
                      }
                    </div>
                    <div className="opacity-80 text-xs">
                      {selectedPractice?.name || 'No Practice Selected'}
                    </div>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-teal-accent text-white font-semibold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
