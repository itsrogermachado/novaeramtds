import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [payerName, setPayerName] = useState('');
  const [payerDocument, setPayerDocument] = useState('');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Format CPF as user types
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 11) {
      setPayerDocument(formatted);
    }
  };

  const generatePix = async () => {
    if (!payerName.trim()) {
      setError('Informe seu nome completo');
      return;
    }

    const cleanCPF = payerDocument.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      setError('CPF inválido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('misticpay-create-pix', {
        body: {
          orderId,
          amount,
          payerName: payerName.trim(),
          payerDocument: cleanCPF,
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
      const { data: order, error } = await supabase
        .from('store_orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (order.status === 'paid') {
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

  // Auto-check payment every 10 seconds when PIX is generated
  useEffect(() => {
    if (!pixData) return;

    const interval = setInterval(async () => {
      try {
        const { data: order } = await supabase
          .from('store_orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (order?.status === 'paid') {
          toast.success('Pagamento confirmado!');
          onPaymentConfirmed();
        }
      } catch (err) {
        console.error('Error auto-checking payment:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pixData, orderId, onPaymentConfirmed]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Show form to collect payer info
  if (!pixData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Pagamento via PIX</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Informe seus dados para gerar o QR Code
          </p>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="payerName">Nome completo</Label>
            <Input
              id="payerName"
              placeholder="Seu nome completo"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="payerDocument">CPF</Label>
            <Input
              id="payerDocument"
              placeholder="000.000.000-00"
              value={payerDocument}
              onChange={handleCPFChange}
              className="mt-1.5"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={generatePix} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              'Gerar QR Code'
            )}
          </Button>
        </div>
      </div>
    );
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
        <Label className="text-sm text-muted-foreground">Ou copie o código PIX</Label>
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
