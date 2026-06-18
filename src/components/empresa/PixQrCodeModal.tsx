import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { Modal, Button, Input, useToast } from '@/components/ui';
import { Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface PixQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeId: string;
  emv: string;
  valor: number;
  freelancerName: string;
}

export function PixQrCodeModal({ isOpen, onClose, chargeId, emv, valor, freelancerName }: PixQrCodeModalProps) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');
  const [isCopied, setIsCopied] = useState(false);
  const [expiryWarning, setExpiryWarning] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollingInterval) clearInterval(pollingInterval);
      return;
    }

    // Initial fetch
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/functions/v1/get-charge-status?chargeId=${encodeURIComponent(chargeId)}`, {
          method: 'GET',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'PAID') {
            setStatus('paid');
            showToast('Pagamento confirmado!', 'success');
            onClose();
          } else if (data.status === 'EXPIRED') {
            setStatus('expired');
            setExpiryWarning(true);
          }
        }
      } catch (e) {
        console.error('Erro ao consultar status da cobrança:', e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    setPollingInterval(interval);

    // Set expiry after 60 min
    const expiryTimeout = setTimeout(() => {
      setExpiryWarning(true);
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(expiryTimeout);
    };
  }, [isOpen, chargeId, onClose, showToast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emv);
      setIsCopied(true);
      showToast('Código EMV copiado!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      showToast('Erro ao copiar código', 'error');
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(`/functions/v1/delete-charge/${encodeURIComponent(chargeId)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStatus('cancelled');
        showToast('Cobrança cancelada', 'success');
        onClose();
      } else {
        showToast('Erro ao cancelar cobrança', 'error');
      }
    } catch (err) {
      showToast('Erro ao cancelar cobrança', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} className="w-[480px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pagamento PIX</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex items-center justify-center">
            <QRCode value={emv} size={180} level="Q" includeMargin={true} />
          </div>

          {/* EMV input + copy */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Código copia-e-cola (EMV)
            </label>
            <div className="flex items-center space-x-3">
              <Input
                value={emv}
                readOnly
                className="flex-1 text-sm font-mono bg-gray-50 border border-gray-300 rounded px-3 py-2"
              />
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={isCopied}
                className="text-sm"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Valor:</span>
              <span className="ml-2">R$ {valor.toFixed(2).replace('.', ',')}</span>
            </div>
            <div>
              <span className="font-medium">Freelancer:</span>
              <span className="ml-2">{freelancerName}</span>
            </div>
          </div>

          {/* Status messages */}
          {status === 'pending' && !expiryWarning && (
            <p className="text-center text-sm text-blue-600">
              Aguardando pagamento PIX...
            </p>
          )}

          {expiryWarning && (
            <div className="text-center text-sm text-orange-600 space-y-2">
              <AlertCircle className="h-5 w-5 mx-auto mb-1" />
              <p>QR Code expirado. Gere um novo QR Code.</p>
              <Button
                variant="outline"
                onClick={() => {
                  // Trigger regenerate via parent (not implemented here)
                  showToast('Funcionalidade de regenerar QR ainda não implementada', 'info');
                }}
                className="text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Gerar novo
              </Button>
            </div>
          )}

          {status === 'paid' && (
            <p className="text-center text-sm text-green-600">
              Pagamento confirmado! <br /> <span className="block mt-1">Fechando...</span>
            </p>
          )}

          {status === 'cancelled' && (
            <p className="text-center text-sm text-gray-600">
              Cobrança cancelada.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={status !== 'pending'}
            className="text-sm"
          >
            Cancelar cobrança
          </Button>
          <Button
            onClick={onClose}
            disabled={status !== 'pending'}
            className="text-sm"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}