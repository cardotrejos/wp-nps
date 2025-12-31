import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { client } from "@/utils/orpc";

interface SendSurveyModalProps {
  surveyId: string;
  surveyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

function validateBrazilPhone(phone: string): string | null {
  if (!phone) {
    return "Phone number is required";
  }

  if (!phone.startsWith("+")) {
    return "Phone must start with country code (e.g., +55)";
  }

  if (!isValidE164(phone)) {
    return "Invalid phone format";
  }

  if (phone.startsWith("+55")) {
    const localNumber = phone.slice(3);
    if (localNumber.length !== 11) {
      return "Brazilian numbers must have 11 digits (DDD + 9 digits)";
    }
  }

  return null;
}

export function SendSurveyModal({
  surveyId,
  surveyName,
  open,
  onOpenChange,
  onSuccess,
}: SendSurveyModalProps) {
  const [phone, setPhone] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [orderId, setOrderId] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string>();

  const sendMutation = useMutation({
    mutationFn: () =>
      client.survey.sendManual({
        surveyId,
        phone,
        metadata: {
          customer_name: customerName || undefined,
          order_id: orderId || undefined,
        },
      }),
    onSuccess: (data) => {
      toast.success(`Survey sent to ${data.phone}`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setPhone("");
    setCustomerName("");
    setOrderId("");
    setPhoneError(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const error = validateBrazilPhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    setPhoneError(undefined);
    sendMutation.mutate();
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (phoneError) {
      const error = validateBrazilPhone(value);
      setPhoneError(error ?? undefined);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send &ldquo;{surveyName}&rdquo;</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              error={phoneError}
              disabled={sendMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name (optional)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Carlos Silva"
              disabled={sendMutation.isPending}
              data-testid="customer-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID (optional)</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-12345"
              disabled={sendMutation.isPending}
              data-testid="order-id-input"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : "Send Survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
