import { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMisticPay } from '@/hooks/useMisticPay';
import { useCreatePurchase } from '@/hooks/useProducts';
import { DigitalProduct } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: DigitalProduct | null;
  onSuccess?: () => void;
}

export function ProductCheckoutDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductCheckoutDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createTransaction, checkTransaction, isLoading } = useMisticPay();
  const { mutateAsync: createPurchase } = useCreatePurchase();

  const [payerName, setPayerName] = useState('');
  const [payerDocument, setPayerDocument] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [copyPaste, setCopyPaste] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('form');
  const [copied, setCopied] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPayerName('');
      setPayerDocument('');
      setTransactionId(null);
      setQrCodeBase64(null);
      setCopyPaste(null);
      setStatus('form');
      setCopied(false);
    }
  }, [open]);

  // Poll for payment status
  useEffect(() => {
    if (!transactionId || status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const result = await checkTransaction(transactionId);
        if (result?.status === 'COMPLETO') {
          setStatus('paid');
          clearInterval(interval);
          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu produto está disponível na sua conta.',
          });
          onSuccess?.();
          setTimeout(() => {
            onOpenChange(false);
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, status, checkTransaction, toast, onSuccess, onOpenChange, navigate]);

  const handleGeneratePix = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comprar.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product) return;

    if (!payerName.trim() || !payerDocument.trim()) {
      toast({
        title: 'Preencha os dados',
        description: 'Nome e CPF são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createTransaction({
        amount: product.price,
        payerName: payerName.trim(),
        payerDocument: payerDocument.replace(/\D/g, ''),
        description: `Compra: ${product.name}`,
      });

      if (result) {
        setTransactionId(result.id);
        setQrCodeBase64(result.qrCodeBase64 || null);
        setCopyPaste(result.copyPaste || null);
        setStatus('pending');

        // Create purchase record
        await createPurchase({
          productId: product.id,
          transactionId: result.id,
          amountPaid: product.price,
        });
      }
    } catch (error) {
      console.error('Error creating PIX:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PIX. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = () => {
    if (copyPaste) {
      navigator.clipboard.writeText(copyPaste);
      setCopied(true);
      toast({ title: 'Código copiado!' });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'paid' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                Pagamento Confirmado!
              </>
            ) : (
              'Finalizar Compra'
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product summary */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                <QrCode className="h-8 w-8 text-primary/50" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">{product.name}</h3>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>

          {status === 'form' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payerName">Nome completo</Label>
                <Input
                  id="payerName"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payerDocument">CPF</Label>
                <Input
                  id="payerDocument"
                  value={payerDocument}
                  onChange={(e) => setPayerDocument(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <Button
                onClick={handleGeneratePix}
                disabled={isLoading}
                className="w-full btn-premium gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    Pagar com PIX
                  </>
                )}
              </Button>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-4">
              {/* QR Code */}
              {qrCodeBase64 && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Copy paste code */}
              {copyPaste && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Ou copie o código PIX:
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg text-xs break-all max-h-20 overflow-auto">
                      {copyPaste}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 p-4 bg-gold/10 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                <span className="text-sm font-medium">
                  Aguardando pagamento...
                </span>
              </div>
            </div>
          )}

          {status === 'paid' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="text-muted-foreground">
                Redirecionando para sua conta...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
