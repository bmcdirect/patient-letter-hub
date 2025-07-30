export type OrderStatus = 
  | 'draft'
  | 'submitted'
  | 'in-review'
  | 'waiting-approval'
  | 'waiting-approval-rev1'
  | 'waiting-approval-rev2'
  | 'waiting-approval-rev3'
  | 'approved'
  | 'in-production'
  | 'production-complete'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'on-hold'
  | 'changes-requested';

export type StatusTransition = {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: ('ADMIN' | 'USER')[];
  requiresComment?: boolean;
  autoNotify?: boolean;
  description: string;
};

export type StatusHistoryEntry = {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  changedByRole: 'ADMIN' | 'USER';
  comments?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

// Define valid status transitions with business rules
export const STATUS_TRANSITIONS: StatusTransition[] = [
  // Customer-initiated transitions
  {
    from: 'draft',
    to: 'submitted',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer submits order for review'
  },
  {
    from: 'submitted',
    to: 'draft',
    allowedRoles: ['USER'],
    requiresComment: true,
    autoNotify: true,
    description: 'Customer withdraws submission for editing'
  },

  // Admin-initiated transitions
  {
    from: 'submitted',
    to: 'in-review',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin begins reviewing order'
  },
  {
    from: 'in-review',
    to: 'waiting-approval',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin uploads initial proof for customer approval'
  },
  {
    from: 'in-review',
    to: 'changes-requested',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin requests changes from customer'
  },
  {
    from: 'waiting-approval',
    to: 'approved',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer approves proof'
  },
  {
    from: 'waiting-approval',
    to: 'waiting-approval-rev1',
    allowedRoles: ['USER'],
    requiresComment: true,
    autoNotify: true,
    description: 'Customer requests changes, admin uploads revision'
  },
  {
    from: 'waiting-approval-rev1',
    to: 'approved',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer approves revision 1'
  },
  {
    from: 'waiting-approval-rev1',
    to: 'waiting-approval-rev2',
    allowedRoles: ['USER'],
    requiresComment: true,
    autoNotify: true,
    description: 'Customer requests more changes, admin uploads revision 2'
  },
  {
    from: 'waiting-approval-rev2',
    to: 'approved',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer approves revision 2'
  },
  {
    from: 'waiting-approval-rev2',
    to: 'waiting-approval-rev3',
    allowedRoles: ['USER'],
    requiresComment: true,
    autoNotify: true,
    description: 'Customer requests final changes, admin uploads revision 3'
  },
  {
    from: 'waiting-approval-rev3',
    to: 'approved',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer approves revision 3'
  },
  {
    from: 'waiting-approval-rev3',
    to: 'cancelled',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin cancels order after max revisions'
  },

  // Production workflow
  {
    from: 'approved',
    to: 'in-production',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin starts production process'
  },
  {
    from: 'in-production',
    to: 'production-complete',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin marks production as complete'
  },
  {
    from: 'production-complete',
    to: 'shipped',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin marks order as shipped'
  },
  {
    from: 'shipped',
    to: 'delivered',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin confirms delivery'
  },
  {
    from: 'delivered',
    to: 'completed',
    allowedRoles: ['ADMIN'],
    requiresComment: false,
    autoNotify: true,
    description: 'Admin marks order as completed'
  },

  // Administrative actions
  {
    from: 'submitted',
    to: 'on-hold',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin puts order on hold'
  },
  {
    from: 'in-review',
    to: 'on-hold',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin puts order on hold during review'
  },
  {
    from: 'on-hold',
    to: 'in-review',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin resumes order from hold'
  },
  {
    from: 'on-hold',
    to: 'cancelled',
    allowedRoles: ['ADMIN'],
    requiresComment: true,
    autoNotify: true,
    description: 'Admin cancels order from hold'
  },
  {
    from: 'changes-requested',
    to: 'in-review',
    allowedRoles: ['USER'],
    requiresComment: false,
    autoNotify: true,
    description: 'Customer resubmits after changes'
  }
];

// Status validation and transition logic
export class StatusManager {
  static isValidTransition(
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    userRole: 'ADMIN' | 'USER'
  ): { valid: boolean; transition?: StatusTransition; error?: string } {
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === fromStatus && t.to === toStatus
    );

    if (!transition) {
      return {
        valid: false,
        error: `Invalid status transition from '${fromStatus}' to '${toStatus}'`
      };
    }

    if (!transition.allowedRoles.includes(userRole)) {
      return {
        valid: false,
        error: `User role '${userRole}' is not authorized for this transition`
      };
    }

    return { valid: true, transition };
  }

  static getAvailableTransitions(
    currentStatus: OrderStatus,
    userRole: 'ADMIN' | 'USER'
  ): StatusTransition[] {
    return STATUS_TRANSITIONS.filter(
      t => t.from === currentStatus && t.allowedRoles.includes(userRole)
    );
  }

  static getStatusDisplayInfo(status: OrderStatus) {
    const statusConfig = {
      draft: { label: 'Draft', color: 'gray', description: 'Order is being prepared' },
      submitted: { label: 'Submitted', color: 'blue', description: 'Order submitted for review' },
      'in-review': { label: 'In Review', color: 'yellow', description: 'Admin is reviewing order' },
      'waiting-approval': { label: 'Waiting for Approval', color: 'orange', description: 'Proof ready for customer approval' },
      'waiting-approval-rev1': { label: 'Waiting for Approval (Rev 1)', color: 'orange', description: 'Revision 1 ready for approval' },
      'waiting-approval-rev2': { label: 'Waiting for Approval (Rev 2)', color: 'orange', description: 'Revision 2 ready for approval' },
      'waiting-approval-rev3': { label: 'Waiting for Approval (Rev 3)', color: 'orange', description: 'Final revision ready for approval' },
      approved: { label: 'Approved', color: 'green', description: 'Proof approved, ready for production' },
      'in-production': { label: 'In Production', color: 'purple', description: 'Order is being produced' },
      'production-complete': { label: 'Production Complete', color: 'indigo', description: 'Production finished' },
      shipped: { label: 'Shipped', color: 'cyan', description: 'Order has been shipped' },
      delivered: { label: 'Delivered', color: 'teal', description: 'Order has been delivered' },
      completed: { label: 'Completed', color: 'green', description: 'Order fully completed' },
      cancelled: { label: 'Cancelled', color: 'red', description: 'Order has been cancelled' },
      'on-hold': { label: 'On Hold', color: 'yellow', description: 'Order is temporarily on hold' },
      'changes-requested': { label: 'Changes Requested', color: 'amber', description: 'Customer requested changes' }
    };

    return statusConfig[status] || {
      label: status,
      color: 'gray',
      description: 'Unknown status'
    };
  }

  static getStatusBadgeVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      submitted: 'default',
      'in-review': 'default',
      'waiting-approval': 'destructive',
      'waiting-approval-rev1': 'destructive',
      'waiting-approval-rev2': 'destructive',
      'waiting-approval-rev3': 'destructive',
      approved: 'secondary',
      'in-production': 'default',
      'production-complete': 'secondary',
      shipped: 'secondary',
      delivered: 'secondary',
      completed: 'secondary',
      cancelled: 'destructive',
      'on-hold': 'outline',
      'changes-requested': 'outline'
    };

    return variantMap[status] || 'default';
  }

  static isCustomerActionable(status: OrderStatus): boolean {
    return [
      'waiting-approval',
      'waiting-approval-rev1',
      'waiting-approval-rev2',
      'waiting-approval-rev3',
      'changes-requested'
    ].includes(status);
  }

  static isAdminActionable(status: OrderStatus): boolean {
    return [
      'submitted',
      'in-review',
      'approved',
      'in-production',
      'production-complete',
      'shipped',
      'delivered',
      'on-hold'
    ].includes(status);
  }

  static requiresCustomerAction(status: OrderStatus): boolean {
    return status.startsWith('waiting-approval');
  }

  static requiresAdminAction(status: OrderStatus): boolean {
    return ['submitted', 'in-review', 'approved', 'in-production', 'production-complete', 'shipped'].includes(status);
  }
} 