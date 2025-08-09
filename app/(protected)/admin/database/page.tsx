import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function DatabasePage() {
  try {
    // Fetch all data from the tables
    const users = await prisma.user.findMany({
      include: {
        practice: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const practices = await prisma.practice.findMany({
      include: {
        users: true,
        _count: {
          select: {
            orders: true,
            quotes: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const quotes = await prisma.quotes.findMany({
      include: {
        practice: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const orders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true,
        files: true,
        _count: {
          select: {
            files: true,
            approvals: true,
            statusHistory: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Database Overview</h1>
            <p className="text-muted-foreground">
              View all data in your database tables
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{practices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>All users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Practice</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{user.name || 'N/A'}</td>
                      <td className="p-2">{user.email || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2">{user.practice?.name || 'N/A'}</td>
                      <td className="p-2">{user.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Practices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Practices ({practices.length})</CardTitle>
            <CardDescription>All practices in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Users</th>
                    <th className="text-left p-2">Orders</th>
                    <th className="text-left p-2">Quotes</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {practices.map((practice) => (
                    <tr key={practice.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{practice.name}</td>
                      <td className="p-2">{practice.email || 'N/A'}</td>
                      <td className="p-2">{practice.phone || 'N/A'}</td>
                      <td className="p-2">{practice.users.length}</td>
                      <td className="p-2">{practice._count.orders}</td>
                      <td className="p-2">{practice._count.quotes}</td>
                      <td className="p-2">{practice.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quotes ({quotes.length})</CardTitle>
            <CardDescription>All quotes in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Quote #</th>
                    <th className="text-left p-2">Practice</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Total Cost</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{quote.quoteNumber}</td>
                      <td className="p-2">{quote.practice.name}</td>
                      <td className="p-2">{quote.user.name || quote.user.email}</td>
                      <td className="p-2">
                        <Badge variant="outline">{quote.status}</Badge>
                      </td>
                      <td className="p-2">${quote.totalCost?.toFixed(2) || 'N/A'}</td>
                      <td className="p-2">{quote.subject || 'N/A'}</td>
                      <td className="p-2">{quote.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
            <CardDescription>All orders in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order #</th>
                    <th className="text-left p-2">Practice</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Cost</th>
                    <th className="text-left p-2">Files</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{order.orderNumber}</td>
                      <td className="p-2">{order.practice.name}</td>
                      <td className="p-2">{order.user.name || order.user.email}</td>
                      <td className="p-2">
                        <Badge variant="outline">{order.status}</Badge>
                      </td>
                      <td className="p-2">{order.subject || 'N/A'}</td>
                      <td className="p-2">${order.cost?.toFixed(2) || 'N/A'}</td>
                      <td className="p-2">{order._count.files}</td>
                      <td className="p-2">{order.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error fetching database data:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Database Error</h1>
            <p className="text-muted-foreground mt-2">
              Unable to fetch database data. Please check your database connection.
            </p>
            <pre className="mt-4 p-4 bg-muted rounded-md text-sm overflow-auto">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </pre>
          </div>
        </div>
      </div>
    );
  }
}
