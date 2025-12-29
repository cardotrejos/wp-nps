import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Hand } from "lucide-react";
import { useUpdateTriggerType } from "@/hooks/use-surveys";

type TriggerType = "api" | "manual";

interface TriggerTypeSelectorProps {
  surveyId: string;
  currentType: TriggerType;
}

const triggerOptions: {
  value: TriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "api",
    label: "API Trigger",
    description:
      "Automatically send surveys when triggered via REST API. Ideal for integrating with your existing systems.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: "manual",
    label: "Manual Send",
    description:
      "Manually send surveys by entering customer phone numbers. Perfect for targeted outreach.",
    icon: <Hand className="h-5 w-5" />,
  },
];

export function TriggerTypeSelector({ surveyId, currentType }: TriggerTypeSelectorProps) {
  const updateTriggerType = useUpdateTriggerType();

  const handleChange = (value: TriggerType) => {
    if (value !== currentType) {
      updateTriggerType.mutate({ surveyId, triggerType: value });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Survey Trigger</h3>
        <p className="text-sm text-muted-foreground">Choose how this survey will be triggered</p>
      </div>

      <RadioGroup
        value={currentType}
        onValueChange={(value: unknown) => handleChange(value as TriggerType)}
        className="grid gap-4"
        disabled={updateTriggerType.isPending}
      >
        {triggerOptions.map((option) => (
          <Label key={option.value} htmlFor={option.value} className="cursor-pointer">
            <Card className={currentType === option.value ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex items-center gap-2">
                  {option.icon}
                  <CardTitle className="text-base">{option.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{option.description}</CardDescription>
              </CardContent>
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
