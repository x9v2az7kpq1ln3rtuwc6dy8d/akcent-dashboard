import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/GlassCard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Shield, Users, FileText, CheckCircle, XCircle, Calendar, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";

interface InviteCode {
  id: number;
  code: string;
  uses: number;
  usesRemaining: number;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  ip: string;
  timestamp: string;
}

export default function AdminPage() {
  const [newCodeUses, setNewCodeUses] = useState("1");
  const [newCodeExpiry, setNewCodeExpiry] = useState("");
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const { data: inviteCodes, isLoading: codesLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/invite-codes"],
    enabled: !!user && user.role === "admin",
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "admin",
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    enabled: !!user && user.role === "admin",
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invite-codes", {
        uses: parseInt(newCodeUses),
        expiresAt: newCodeExpiry || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-codes"] });
      setNewCodeUses("1");
      setNewCodeExpiry("");
      toast({
        title: "Code Generated",
        description: "New invite code created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Generate Code",
        description: error.message,
      });
    },
  });

  const revokeCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/invite-codes/${id}/revoke`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-codes"] });
      toast({
        title: "Code Revoked",
        description: "Invite code has been revoked",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Revoke Code",
        description: error.message,
      });
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/users/${id}/toggle`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Updated",
        description: "User status has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Update User",
        description: error.message,
      });
    },
  });

  const handleGenerateCode = () => {
    generateCodeMutation.mutate();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Invite code copied to clipboard",
    });
  };

  const handleRevokeCode = (id: number) => {
    revokeCodeMutation.mutate(id);
  };

  const handleToggleUser = (id: number) => {
    toggleUserMutation.mutate(id);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "text-primary";
    if (action.includes("REGISTERED")) return "text-green-400";
    if (action.includes("CODE")) return "text-accent";
    if (action.includes("DOWNLOADED")) return "text-purple-400";
    if (action.includes("REVOKED") || action.includes("DEACTIVATED")) return "text-destructive";
    if (action.includes("ACTIVATED")) return "text-green-400";
    return "text-foreground";
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge className="bg-accent/20 text-accent border-accent/30">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-dashboard">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" data-testid="button-logout" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard>
            <Tabs defaultValue="codes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="codes" data-testid="tab-invite-codes">
                  <FileText className="w-4 h-4 mr-2" />
                  Invite Codes
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-audit-log">
                  <Calendar className="w-4 h-4 mr-2" />
                  Audit Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="codes" className="space-y-6">
                <GlassCard title="Generate New Code" glowColor="accent">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="uses">Number of Uses</Label>
                      <Input
                        id="uses"
                        data-testid="input-code-uses"
                        type="number"
                        min="1"
                        value={newCodeUses}
                        onChange={(e) => setNewCodeUses(e.target.value)}
                        className="bg-input/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                      <Input
                        id="expiry"
                        data-testid="input-code-expiry"
                        type="date"
                        value={newCodeExpiry}
                        onChange={(e) => setNewCodeExpiry(e.target.value)}
                        className="bg-input/50"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        data-testid="button-generate-code"
                        onClick={handleGenerateCode} 
                        className="w-full"
                        disabled={generateCodeMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Code
                      </Button>
                    </div>
                  </div>
                </GlassCard>

                {codesLoading ? (
                  <div className="text-center text-muted-foreground">Loading invite codes...</div>
                ) : (
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-card-border">
                          <TableHead className="text-muted-foreground">Code</TableHead>
                          <TableHead className="text-muted-foreground">Uses</TableHead>
                          <TableHead className="text-muted-foreground">Expires</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">Created</TableHead>
                          <TableHead className="text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteCodes?.map((code) => (
                          <TableRow key={code.id} data-testid={`row-code-${code.id}`} className="border-card-border hover-elevate">
                            <TableCell className="font-mono text-primary">{code.code}</TableCell>
                            <TableCell>
                              <span className="text-foreground">{code.uses - code.usesRemaining}</span>
                              <span className="text-muted-foreground"> / {code.uses}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {code.expiresAt ? format(new Date(code.expiresAt), "MMM dd, yyyy") : "Never"}
                            </TableCell>
                            <TableCell>
                              {code.revoked ? (
                                <Badge variant="destructive">Revoked</Badge>
                              ) : code.usesRemaining > 0 ? (
                                <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Used</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(code.createdAt), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  data-testid={`button-copy-${code.id}`}
                                  onClick={() => handleCopyCode(code.code)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                {!code.revoked && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    data-testid={`button-revoke-${code.id}`}
                                    onClick={() => handleRevokeCode(code.id)}
                                    disabled={revokeCodeMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users">
                {usersLoading ? (
                  <div className="text-center text-muted-foreground">Loading users...</div>
                ) : (
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-card-border">
                          <TableHead className="text-muted-foreground">Username</TableHead>
                          <TableHead className="text-muted-foreground">Role</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">Created</TableHead>
                          <TableHead className="text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((u) => (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`} className="border-card-border hover-elevate">
                            <TableCell className="font-medium text-foreground">{u.username}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.active ? (
                                <div className="flex items-center gap-2 text-primary">
                                  <CheckCircle className="w-4 h-4" />
                                  Active
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <XCircle className="w-4 h-4" />
                                  Inactive
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(u.createdAt), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Switch
                                data-testid={`switch-user-${u.id}`}
                                checked={u.active}
                                onCheckedChange={() => handleToggleUser(u.id)}
                                disabled={toggleUserMutation.isPending}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs">
                {logsLoading ? (
                  <div className="text-center text-muted-foreground">Loading audit logs...</div>
                ) : (
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-card-border">
                          <TableHead className="text-muted-foreground">Timestamp</TableHead>
                          <TableHead className="text-muted-foreground">User</TableHead>
                          <TableHead className="text-muted-foreground">Action</TableHead>
                          <TableHead className="text-muted-foreground">IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs?.map((log) => (
                          <TableRow key={log.id} data-testid={`row-log-${log.id}`} className="border-card-border hover-elevate">
                            <TableCell className="text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{log.username}</TableCell>
                            <TableCell>
                              <span className={getActionColor(log.action)}>
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono">{log.ip}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </GlassCard>
        </motion.div>

        <div className="fixed bottom-4 right-4 text-xs text-muted-foreground/50">
          Admin Console
        </div>
      </div>
    </div>
  );
}
