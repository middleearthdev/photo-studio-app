"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CreditCard,
  Building2,
  Smartphone,
  QrCode,
  Banknote,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

interface PaymentMethod {
  id: string
  studio_id: string
  name: string
  type: "bank_transfer" | "e_wallet" | "qr_code" | "cash" | "credit_card"
  provider?: string
  account_details: Record<string, any>
  xendit_config?: Record<string, any>
  fee_percentage: number
  is_active: boolean
  created_at: string
}

// Mock data - replace with actual data fetching
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546013",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Transfer Bank BCA",
    type: "bank_transfer",
    provider: "BCA",
    account_details: {
      account_number: "1234567890",
      account_name: "Lumina Photography Studio",
      bank_code: "BCA"
    },
    fee_percentage: 0.00,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546014",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Transfer Bank Mandiri",
    type: "bank_transfer",
    provider: "Mandiri",
    account_details: {
      account_number: "9876543210",
      account_name: "Lumina Photography Studio",
      bank_code: "Mandiri"
    },
    fee_percentage: 0.00,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546015",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "QRIS",
    type: "qr_code",
    provider: "Xendit",
    account_details: {
      merchant_id: "lumina_photo_studio",
      qr_code_id: "qr_lumina_001"
    },
    xendit_config: {
      api_key: "***hidden***",
      callback_url: "https://api.luminastudio.id/webhook/xendit"
    },
    fee_percentage: 0.70,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546016",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "GoPay",
    type: "e_wallet",
    provider: "Xendit",
    account_details: {
      merchant_id: "lumina_photo_studio"
    },
    xendit_config: {
      api_key: "***hidden***",
      callback_url: "https://api.luminastudio.id/webhook/xendit"
    },
    fee_percentage: 2.00,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546017",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "OVO",
    type: "e_wallet",
    provider: "Xendit",
    account_details: {
      merchant_id: "lumina_photo_studio"
    },
    xendit_config: {
      api_key: "***hidden***",
      callback_url: "https://api.luminastudio.id/webhook/xendit"
    },
    fee_percentage: 2.00,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546018",
    studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Cash",
    type: "cash",
    account_details: {
      accepted_at: "studio_location"
    },
    fee_percentage: 0.00,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z"
  }
]

const paymentTypeOptions = [
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { value: "e_wallet", label: "E-Wallet", icon: Smartphone },
  { value: "qr_code", label: "QR Code", icon: QrCode },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
]

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "bank_transfer" as PaymentMethod["type"],
    provider: "",
    account_details: "{}",
    xendit_config: "{}",
    fee_percentage: 0,
    is_active: true
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Payment method name is required")
      return
    }

    try {
      const accountDetails = JSON.parse(formData.account_details || "{}")
      const xenditConfig = formData.xendit_config ? JSON.parse(formData.xendit_config) : undefined

      if (editingMethod) {
        // Update existing method
        setPaymentMethods(methods => methods.map(method => 
          method.id === editingMethod.id 
            ? { 
                ...method, 
                ...formData,
                account_details: accountDetails,
                xendit_config: xenditConfig
              }
            : method
        ))
        toast.success("Payment method updated successfully!")
      } else {
        // Create new method
        const newMethod: PaymentMethod = {
          id: `pm-${Date.now()}`,
          studio_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          ...formData,
          account_details: accountDetails,
          xendit_config: xenditConfig,
          created_at: new Date().toISOString()
        }
        setPaymentMethods(methods => [...methods, newMethod])
        toast.success("Payment method created successfully!")
      }

      // Reset form
      setFormData({
        name: "",
        type: "bank_transfer",
        provider: "",
        account_details: "{}",
        xendit_config: "{}",
        fee_percentage: 0,
        is_active: true
      })
      setEditingMethod(null)
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Invalid JSON in account details or config")
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type,
      provider: method.provider || "",
      account_details: JSON.stringify(method.account_details, null, 2),
      xendit_config: method.xendit_config ? JSON.stringify(method.xendit_config, null, 2) : "{}",
      fee_percentage: method.fee_percentage,
      is_active: method.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (methodId: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== methodId))
    toast.success("Payment method deleted successfully!")
  }

  const handleToggleActive = (methodId: string) => {
    setPaymentMethods(methods => methods.map(method => 
      method.id === methodId 
        ? { ...method, is_active: !method.is_active }
        : method
    ))
  }

  const openCreateDialog = () => {
    setEditingMethod(null)
    setFormData({
      name: "",
      type: "bank_transfer",
      provider: "",
      account_details: "{}",
      xendit_config: "{}",
      fee_percentage: 0,
      is_active: true
    })
    setIsDialogOpen(true)
  }

  const getTypeIcon = (type: PaymentMethod["type"]) => {
    const typeOption = paymentTypeOptions.find(option => option.value === type)
    return typeOption?.icon || CreditCard
  }

  const getTypeLabel = (type: PaymentMethod["type"]) => {
    const typeOption = paymentTypeOptions.find(option => option.value === type)
    return typeOption?.label || type
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage payment methods available for customer transactions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Methods</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.filter(method => method.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fee</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(paymentMethods.reduce((acc, method) => acc + method.fee_percentage, 0) / paymentMethods.length).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Methods</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.filter(method => !method.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Configure available payment options for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => {
                const TypeIcon = getTypeIcon(method.type)
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium">{method.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(method.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {method.provider || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {method.fee_percentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={method.is_active ? "default" : "secondary"}>
                          {method.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={() => handleToggleActive(method.id)}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(method.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(method)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{method.name}"? 
                                  This action cannot be undone and may affect existing transactions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(method.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : "Add New Payment Method"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod 
                ? "Update the payment method configuration below." 
                : "Configure a new payment method for customer transactions."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Method Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Transfer Bank BCA, GoPay"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type *</Label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => handleInputChange("provider", e.target.value)}
                  placeholder="e.g., BCA, Xendit, Midtrans"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_percentage">Fee Percentage (%)</Label>
                <Input
                  id="fee_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.fee_percentage}
                  onChange={(e) => handleInputChange("fee_percentage", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_details">Account Details (JSON)</Label>
              <Textarea
                id="account_details"
                value={formData.account_details}
                onChange={(e) => handleInputChange("account_details", e.target.value)}
                placeholder='{"account_number": "1234567890", "account_name": "Studio Name"}'
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter account details in JSON format
              </p>
            </div>

            {(formData.type === "e_wallet" || formData.type === "qr_code") && (
              <div className="space-y-2">
                <Label htmlFor="xendit_config">Xendit Configuration (JSON)</Label>
                <Textarea
                  id="xendit_config"
                  value={formData.xendit_config}
                  onChange={(e) => handleInputChange("xendit_config", e.target.value)}
                  placeholder='{"api_key": "your-api-key", "callback_url": "https://your-domain.com/webhook"}'
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter Xendit API configuration for e-wallets and QR codes
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Active (available for customers)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingMethod ? "Update" : "Create"} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}