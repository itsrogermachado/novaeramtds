import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMisticPay } from '@/hooks/useMisticPay';
import { Copy, Check, Loader2, QrCode, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  description?: string;
  onSuccess?: () => void;
}

export function PixCheckoutDialog({
  open,
  onOpenChange,
  amount: initialAmount,
  description = 'Pagamento Nova Era',
  onSuccess,
}: PixCheckoutDialogProps) {
  const [step, setStep] = useState<'form' | 'qrcode' | 'success' | 'error'>('form');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [payerName, setPayerName] = useState('');
  const [payerDocument, setPayerDocument] = useState('');
  const [copied, setCopied] = useState(false);
  const [transactionData, setTransactionData] = useState<{
    transactionId: string;
    qrCodeBase64: string;
    copyPaste: string;
  } | null>(null);
  const [_status, setStatus] = useState<'PENDENTE' | 'COMPLETO' | 'FALHA'>('PENDENTE');

  const { createTransaction, checkTransaction, isLoading } = useMisticPay();
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('form');
      setAmount(initialAmount?.toString() || '');
      setPayerName('');
      setPayerDocument('');
      setTransactionData(null);
      setStatus('PENDENTE');
      setCopied(false);
    }
  }, [open, initialAmount]);

  // Poll for payment status
  useEffect(() => {
    if (step !== 'qrcode' || !transactionData?.transactionId) return;

    const interval = setInterval(async () => {
      const result = await checkTransaction(transactionData.transactionId);
      if (result) {
        setStatus(result.status);
        if (result.status === 'COMPLETO') {
          setStep('success');
          onSuccess?.();
          clearInterval(interval);
        } else if (result.status === 'FALHA') {
          setStep('error');
          clearInterval(interval);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [step, transactionData, checkTransaction, onSuccess]);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({ title: 'Erro', description: 'Valor inválido', variant: 'destructive' });
      return;
    }

    if (!payerName.trim() || payerName.trim().length < 2) {
      toast({ title: 'Erro', description: 'Nome inválido', variant: 'destructive' });
      return;
    }

    const cpfDigits = payerDocument.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast({ title: 'Erro', description: 'CPF inválido', variant: 'destructive' });
      return;
    }

    const result = await createTransaction({
      amount: amountValue,
      payerName: payerName.trim(),
      payerDocument: cpfDigits,
      description,
    });

    if (result) {
      setTransactionData({
        transactionId: result.transactionId,
        qrCodeBase64: result.qrCodeBase64,
        copyPaste: result.copyPaste,
      });
      setStep('qrcode');
    }
  };

  const handleCopy = useCallback(async () => {
    if (!transactionData?.copyPaste) return;
    
    try {
      await navigator.clipboard.writeText(transactionData.copyPaste);
      setCopied(true);
      toast({ title: 'Copiado!', description: 'Código PIX copiado para a área de transferência' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar', variant: 'destructive' });
    }
  }, [transactionData, toast]);

  const handleRefresh = async () => {
    if (!transactionData?.transactionId) return;
    
    const result = await checkTransaction(transactionData.transactionId);
    if (result) {
      setStatus(result.status);
      if (result.status === 'COMPLETO') {
        setStep('success');
        onSuccess?.();
      } else if (result.status === 'FALHA') {
        setStep('error');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Preencha os dados para gerar o QR Code PIX'}
            {step === 'qrcode' && 'Escaneie o QR Code ou copie o código PIX'}
            {step === 'success' && 'Pagamento confirmado com sucesso!'}
            {step === 'error' && 'Houve um problema com o pagamento'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!!initialAmount}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerName">Nome completo</Label>
              <Input
                id="payerName"
                type="text"
                placeholder="Seu nome completo"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerDocument">CPF</Label>
              <Input
                id="payerDocument"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={payerDocument}
                onChange={(e) => setPayerDocument(formatCPF(e.target.value))}
                maxLength={14}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando PIX...
                </>
              ) : (
                'Gerar QR Code PIX'
              )}
            </Button>
          </form>
        )}

        {step === 'qrcode' && transactionData && (
          <div className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="text-sm font-medium">Aguardando pagamento...</span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <img
                  src={transactionData.qrCodeBase64}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Amount display */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="text-2xl font-bold text-primary">
                R$ {parseFloat(amount.replace(',', '.')).toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Copy paste code */}
            <div className="space-y-2">
              <Label>Código PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input
                  value={transactionData.copyPaste}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Refresh button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar pagamento
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Pagamento confirmado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seu pagamento foi processado com sucesso.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Pagamento não confirmado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Houve um problema com o pagamento. Tente novamente.
              </p>
            </div>
            <Button onClick={() => setStep('form')} variant="outline" className="w-full">
              Tentar novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
