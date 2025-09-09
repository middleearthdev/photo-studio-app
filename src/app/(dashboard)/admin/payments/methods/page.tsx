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
  Info,
} from "lucide-react"
import { toast } from "sonner"
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useTogglePaymentMethodStatus
} from "@/hooks/use-payment-methods"
import { useStudios } from "@/hooks/use-studios"
import { type PaymentMethod } from "@/actions/payments"
import { shouldCustomerPayFees, shouldDisplayFeesToCustomers } from "@/lib/config/fee-config"

// Extended PaymentMethod interface to include new fee fields
interface ExtendedPaymentMethod extends PaymentMethod {
  fee_type?: string
  fee_amount?: number
}

export default function PaymentMethodsPage() {
  // All hooks must be called first, before any early returns or conditional logic
  const [selectedStudioId, setSelectedStudioId] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ExtendedPaymentMethod | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "bank_transfer",
    provider: "",
    account_details: "{}",
    xendit_config: "{}",
    fee_type: "percentage", // New field
    fee_percentage: 0,
    fee_amount: 0, // New field
    is_active: true,
  })

  const { data: studios = [], isLoading: studiosLoading } = useStudios()
  const { data: paymentMethods = [], isLoading: paymentsLoading } = usePaymentMethods(selectedStudioId || '')

  // Mutations
  const createMutation = useCreatePaymentMethod()
  const updateMutation = useUpdatePaymentMethod()
  const deleteMutation = useDeletePaymentMethod()
  const toggleStatusMutation = useTogglePaymentMethodStatus()

  // Set default studio
  React.useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id)
    }
  }, [studios, selectedStudioId])

  // All utility functions after hooks
  const getPaymentTypeIcon = (type: string) => {
    const icons = {
      bank_transfer: Building2,
      virtual_account: CreditCard,
      e_wallet: Smartphone,
      qr_code: QrCode,
      cash: Banknote,
      credit_card: CreditCard,
    }
    const Icon = icons[type as keyof typeof icons] || CreditCard
    return <Icon className="h-4 w-4" />
  }

  const getPaymentTypeColor = (type: string) => {
    const colors = {
      bank_transfer: "bg-blue-100 text-blue-800",
      virtual_account: "bg-indigo-100 text-indigo-800",
      e_wallet: "bg-green-100 text-green-800",
      qr_code: "bg-purple-100 text-purple-800",
      cash: "bg-gray-100 text-gray-800",
      credit_card: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const handleAddNew = () => {
    setEditingMethod(null)
    setIsSaving(false)
    setFormData({
      name: "",
      type: "bank_transfer",
      provider: "",
      account_details: "{}",
      xendit_config: "{}",
      fee_type: "percentage",
      fee_percentage: 0,
      fee_amount: 0,
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (method: ExtendedPaymentMethod) => {
    setEditingMethod(method)
    setIsSaving(false)
    setFormData({
      name: method.name,
      type: method.type,
      provider: method.provider,
      account_details: JSON.stringify(method.account_details, null, 2),
      xendit_config: JSON.stringify(method.xendit_config || {}, null, 2),
      fee_type: method.fee_type || "percentage",
      fee_percentage: method.fee_percentage,
      fee_amount: method.fee_amount || 0,
      is_active: method.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)

    try {
      // Validate form data
      if (!formData.name.trim()) {
        toast.error("Payment method name is required")
        setIsSaving(false)
        return
      }

      if (!selectedStudioId) {
        toast.error("Please select a studio")
        setIsSaving(false)
        return
      }

      // Validate fee inputs
      if (formData.fee_type === "percentage" && (formData.fee_percentage < 0 || formData.fee_percentage > 100)) {
        toast.error("Fee percentage must be between 0 and 100")
        setIsSaving(false)
        return
      }

      if (formData.fee_type === "fixed" && formData.fee_amount < 0) {
        toast.error("Fee amount must be greater than or equal to 0")
        setIsSaving(false)
        return
      }

      // Validate Xendit config if provider is Xendit
      if (formData.provider === 'Xendit') {
        try {
          JSON.parse(formData.xendit_config)
        } catch (e) {
          toast.error("Invalid Xendit configuration JSON")
          setIsSaving(false)
          return
        }
      }

      // Validate account details JSON
      try {
        JSON.parse(formData.account_details)
      } catch (e) {
        toast.error("Invalid account details JSON")
        setIsSaving(false)
        return
      }

      const paymentMethodData = {
        studio_id: selectedStudioId,
        name: formData.name.trim(),
        type: formData.type,
        provider: formData.provider,
        account_details: JSON.parse(formData.account_details),
        xendit_config: formData.provider === 'Xendit' ? JSON.parse(formData.xendit_config) : {},
        fee_type: formData.fee_type,
        fee_percentage: formData.fee_type === "percentage" ? formData.fee_percentage : 0,
        fee_amount: formData.fee_type === "fixed" ? formData.fee_amount : 0,
        is_active: formData.is_active,
      }

      if (editingMethod) {
        // Update existing payment method
        const { studio_id, ...updateData } = paymentMethodData
        await updateMutation.mutateAsync({
          id: editingMethod.id,
          data: updateData
        })
      } else {
        // Create new payment method
        await createMutation.mutateAsync(paymentMethodData)
      }

      // Add small delay to allow toast to show before closing dialog
      setTimeout(() => {
        setIsDialogOpen(false)
      }, 100)
    } catch (error) {
      console.error('Error saving payment method:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (methodId: string) => {
    try {
      const method = paymentMethods.find(m => m.id === methodId)
      if (!method) return

      await toggleStatusMutation.mutateAsync({
        id: methodId,
        isActive: !method.is_active
      })
    } catch (error) {
      console.error('Error toggling payment method status:', error)
    }
  }

  const handleDelete = async (methodId: string) => {
    try {
      await deleteMutation.mutateAsync(methodId)
    } catch (error) {
      console.error('Error deleting payment method:', error)
    }
  }

  // Format fee display based on fee type
  const formatFeeDisplay = (method: ExtendedPaymentMethod) => {
    if (method.fee_type === "fixed") {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(method.fee_amount || 0)
    }
    return `${method.fee_percentage}%`
  }

  if (studiosLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage payment methods for your studio
          </p>
        </div>
        <Button onClick={handleAddNew} disabled={!selectedStudioId}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Studio Selection */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="space-y-2">
              <Label>Select Studio</Label>
              <Select value={selectedStudioId} onValueChange={setSelectedStudioId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select studio..." />
                </SelectTrigger>
                <SelectContent>
                  {studios.map((studio) => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudioId && (
              <div className="flex gap-4 pt-6 md:pt-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {paymentMethods.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Methods</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {paymentMethods.filter(m => m.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Configuration Notice */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Payment Fee Configuration</h3>
              <p className="text-sm text-blue-800">
                {shouldCustomerPayFees() 
                  ? "Customers are currently paying payment processing fees." 
                  : "Studio is currently absorbing payment processing fees."}
                {" "}
                {shouldDisplayFeesToCustomers() 
                  ? "Fees are displayed to customers during booking." 
                  : "Fees are hidden from customers."}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Configure these settings in your environment variables (.env.local)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Table */}
      {!selectedStudioId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Please select a studio to view payment methods
            </div>
          </CardContent>
        </Card>
      ) : paymentsLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Configure payment methods for your studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No payment methods found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getPaymentTypeColor(method.type)}`}>
                              {getPaymentTypeIcon(method.type)}
                            </div>
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {method.type.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {method.provider || '-'}
                        </TableCell>
                        <TableCell>
                          {formatFeeDisplay(method as ExtendedPaymentMethod)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={method.is_active ? "default" : "secondary"}>
                              {method.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={method.is_active}
                              onCheckedChange={() => handleToggleActive(method.id)}
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(method as ExtendedPaymentMethod)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{method.name}"? This action cannot be undone.
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription>
              Configure payment method settings for your studio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Method Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bank BCA Transfer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Payment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer (Manual)</SelectItem>
                    <SelectItem value="virtual_account">Virtual Account (Xendit)</SelectItem>
                    <SelectItem value="e_wallet">E-Wallet</SelectItem>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Midtrans">Midtrans</SelectItem>
                    <SelectItem value="Xendit">Xendit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_type">Fee Type</Label>
                <Select
                  value={formData.fee_type}
                  onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee Input based on fee type */}
            <div className="grid grid-cols-2 gap-4">
              {formData.fee_type === "percentage" ? (
                <div className="space-y-2">
                  <Label htmlFor="fee_percentage">Fee Percentage (%)</Label>
                  <Input
                    id="fee_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.fee_percentage}
                    onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fee_amount">Fee Amount (IDR)</Label>
                  <Input
                    id="fee_amount"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>

            {/* Xendit Configuration */}
            {formData.provider === 'Xendit' && (
              <div className="space-y-2">
                <Label htmlFor="xendit-config">Xendit Configuration (JSON)</Label>
                <Textarea
                  id="xendit-config"
                  value={formData.xendit_config}
                  onChange={(e) => setFormData({ ...formData, xendit_config: e.target.value })}
                  placeholder='{"api_key": "your_api_key", "callback_url": "https://yourdomain.com/api/webhooks/xendit"}'
                  className="font-mono text-sm"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Enter Xendit-specific configuration as JSON
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="account_details">Account Details (JSON)</Label>
              <Textarea
                id="account_details"
                value={formData.account_details}
                onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                placeholder='{"account_number": "1234567890", "account_name": "Studio Name"}'
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingMethod ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingMethod ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}