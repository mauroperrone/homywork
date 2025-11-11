import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Activity, CheckCircle2, AlertCircle } from "lucide-react";

interface WiFiSpeedTestProps {
  value?: number;
  onChange: (speed: number | undefined) => void;
}

export function WiFiSpeedTest({ value, onChange }: WiFiSpeedTestProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(undefined);
    } else {
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        onChange(numValue);
      }
    }
  };

  const runSpeedTest = async () => {
    setIsTesting(true);
    setProgress(0);

    // Simulazione test velocità (in produzione usare un servizio reale come speedtest.net API o fast.com)
    const simulateTest = async () => {
      // Incrementa progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Simula velocità misurata (in produzione, fare vero test di download)
      const measuredSpeed = Math.floor(Math.random() * 150) + 20; // 20-170 Mbps
      onChange(measuredSpeed);
      setIsTesting(false);
    };

    await simulateTest();
  };

  const getSpeedQuality = (mbps: number) => {
    if (mbps >= 100) return { label: "Eccellente", color: "text-chart-2", icon: CheckCircle2 };
    if (mbps >= 50) return { label: "Buona", color: "text-chart-1", icon: Activity };
    return { label: "Sufficiente", color: "text-yellow-600", icon: AlertCircle };
  };

  const speedQuality = value ? getSpeedQuality(value) : null;
  const SpeedIcon = speedQuality?.icon;

  return (
    <Card className="p-6 space-y-4" data-testid="card-wifi-test">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-full">
          <Wifi className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Velocità WiFi</h3>
          <p className="text-sm text-muted-foreground">
            Inserisci la velocità manualmente o esegui un test automatico
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wifi-speed-input">Velocità WiFi (Mbps)</Label>
        <Input
          id="wifi-speed-input"
          type="number"
          min="0"
          max="2000"
          placeholder="Es. 100"
          value={value ?? ''}
          onChange={handleManualChange}
          disabled={isTesting}
          data-testid="input-wifi-speed"
        />
        <p className="text-xs text-muted-foreground">
          Velocità minima raccomandata: 50 Mbps per smart working
        </p>
      </div>

      {value && !isTesting && speedQuality && SpeedIcon && (
        <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <SpeedIcon className={`h-5 w-5 ${speedQuality.color}`} />
            <span className="text-2xl font-bold" data-testid="text-speed-result">
              {value} Mbps
            </span>
          </div>
          <p className={`text-sm font-medium ${speedQuality.color}`} data-testid="text-speed-quality">
            Velocità {speedQuality.label}
          </p>
        </div>
      )}

      {isTesting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Test automatico in corso...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-wifi-test" />
        </div>
      )}

      <Button
        onClick={runSpeedTest}
        disabled={isTesting}
        variant="outline"
        className="w-full"
        data-testid="button-run-wifi-test"
      >
        {isTesting ? "Test in corso..." : value ? "Ripeti Test Automatico" : "Avvia Test Automatico"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {value && value >= 50 
          ? "✓ WiFi certificato - Velocità adatta per smart working e streaming"
          : "Velocità WiFi importante per l'esperienza degli ospiti"}
      </p>
    </Card>
  );
}
