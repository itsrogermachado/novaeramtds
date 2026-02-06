import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Copy, CheckCircle2, Loader2, RefreshCw, 
  AlertCircle, QrCode 
} from 'lucide-react';
import { toast } from 'sonner';

interface PixCheckoutProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

interface PixData {
  transactionId: string;
  qrCodeBase64: string;
  qrcodeUrl: string;
  copyPaste: string;
  amount: number;
}

export function PixCheckout({ 
  orderId, 
  amount, 
  customerEmail,
  onPaymentConfirmed,
  onCancel 
}: PixCheckoutProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const generatePix = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('misticpay-create-pix', {
        body: {
          orderId,
          amount,
          payerName: 'Cliente Nova Era',
          payerDocument: '00000000000',
          description: `Compra Nova Era - ${customerEmail}`,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setPixData(data);
    } catch (err) {
      console.error('Error generating PIX:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.copyPaste) return;

    try {
      await navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId) return;

    setCheckingPayment(true);

    try {
      // Use edge function to check status securely (no RLS bypass needed)
      const { data, error } = await supabase.functions.invoke('check-order-status', {
        body: { orderId },
      });

      if (error) throw error;

      if (data.status === 'paid' || data.status === 'delivered') {
        toast.success('Pagamento confirmado!');
        onPaymentConfirmed();
      } else {
        toast.info('Pagamento ainda não confirmado. Tente novamente em alguns segundos.');
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      toast.error('Erro ao verificar pagamento');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Use edge function for initial check and periodic polling (Realtime requires RLS access)
  useEffect(() => {
    if (!pixData || !orderId) return;

    // Check status via edge function
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderId },
        });

        if (!error && (data?.status === 'paid' || data?.status === 'delivered')) {
          toast.success('Pagamento confirmado!');
          onPaymentConfirmed();
          return true;
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
      return false;
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds (faster than before, but using secure edge function)
    const interval = setInterval(async () => {
      const confirmed = await checkStatus();
      if (confirmed) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, orderId, onPaymentConfirmed]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Auto-generate PIX on mount
  useEffect(() => {
    if (!pixData && !isLoading && !error) {
      generatePix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading state while generating PIX
  if (!pixData && isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Gerando PIX...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Aguarde enquanto geramos o QR Code
          </p>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!pixData && error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Erro ao gerar PIX</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={generatePix}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Show loading placeholder if no data yet
  if (!pixData) {
    return null;
  }

  // Show QR Code and payment info
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <QrCode className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Escaneie o QR Code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Abra o app do seu banco e escaneie o código
        </p>
      </div>

      {/* Amount */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <p className="text-sm text-muted-foreground">Valor a pagar</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(pixData.amount)}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="p-4 bg-white rounded-xl shadow-lg">
          <img 
            src={pixData.qrCodeBase64 || pixData.qrcodeUrl} 
            alt="QR Code PIX"
            className="w-48 h-48"
          />
        </div>
      </div>

      {/* Copy & Paste */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Ou copie o código PIX</p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={pixData.copyPaste}
            className="font-mono text-xs"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={copyToClipboard}
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

      {/* Check Payment Button */}
      <Button 
        variant="outline" 
        className="w-full gap-2"
        onClick={checkPaymentStatus}
        disabled={checkingPayment}
      >
        {checkingPayment ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Já fiz o pagamento
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        O pagamento é verificado automaticamente. Após o pagamento, você receberá a confirmação.
      </p>
    </div>
  );
}
