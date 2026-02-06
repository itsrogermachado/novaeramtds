import { useState } from 'react';
import { useStoreCoupons, StoreCoupon } from '@/hooks/useStoreCoupons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { CouponFormDialog } from './CouponFormDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { Plus, Pencil, Trash2, Ticket, Percent, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function StoreCouponsTab() {
  const { coupons, isLoading, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } = useStoreCoupons();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<StoreCoupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (coupon: StoreCoupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof createCoupon>[0]) => {
    if (editingCoupon) {
      return updateCoupon(editingCoupon.id, data);
    }
    return createCoupon(data);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCoupon(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Cupons de Desconto
        </CardTitle>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cupom
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
            <Button onClick={handleAdd} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Cupom
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Valor Mín/Máx</TableHead>
                  <TableHead>Desconto Máx</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={(checked) => toggleCouponStatus(coupon.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold">
                        {coupon.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? (
                          <>
                            <Percent className="h-3 w-3 text-muted-foreground" />
                            <span>{coupon.discount_value}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span>{formatCurrency(coupon.discount_value)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {coupon.used_count}/{coupon.max_uses > 0 ? coupon.max_uses : '∞'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {coupon.min_order_value > 0 ? formatCurrency(coupon.min_order_value) : '-'}
                        {' / '}
                        {coupon.max_order_value > 0 ? formatCurrency(coupon.max_order_value) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {coupon.max_discount_amount > 0 
                        ? formatCurrency(coupon.max_discount_amount) 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(coupon.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CouponFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={editingCoupon}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Cupom"
        description="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
      />
    </Card>
  );
}
