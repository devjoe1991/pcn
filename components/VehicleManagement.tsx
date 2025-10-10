'use client';
import { useState, useEffect, useCallback } from 'react';
import { Car, Plus, Trash2, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PaymentForm from './PaymentForm';

interface Vehicle {
  id: string;
  registration: string;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  is_primary: boolean;
  created_at: string;
}

interface VehicleManagementProps {
  userId: string;
  onVehicleAdded: () => void;
}

export function VehicleManagement({ userId, onVehicleAdded }: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registration: '',
    make: '',
    model: '',
    color: '',
    year: ''
  });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'vehicle_addition'>('vehicle_addition');

  useEffect(() => {
    fetchVehicles();
  }, [userId, fetchVehicles]);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(`/api/vehicles?userId=${userId}`);
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addVehicle = async () => {
    if (!newVehicle.registration.trim()) return;

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          vehicleReg: newVehicle.registration.toUpperCase(),
          make: newVehicle.make,
          model: newVehicle.model,
          color: newVehicle.color,
          year: newVehicle.year ? parseInt(newVehicle.year) : undefined
        }),
      });

      if (response.ok) {
        setNewVehicle({ registration: '', make: '', model: '', color: '', year: '' });
        setShowAddDialog(false);
        fetchVehicles();
        onVehicleAdded();
      } else {
        const error = await response.json();
        if (error.requiresPayment) {
          setShowPayment(true);
          setPaymentType('vehicle_addition');
        }
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const removeVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });

      if (response.ok) {
        fetchVehicles();
        onVehicleAdded();
      }
    } catch (error) {
      console.error('Error removing vehicle:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    addVehicle();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Vehicles</h2>
          <p className="text-gray-400">Manage your registered vehicles for PCN appeals</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Add a vehicle to your account. Additional vehicles cost £3 each.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="registration">Registration Number *</Label>
                <Input
                  id="registration"
                  value={newVehicle.registration}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registration: e.target.value })}
                  placeholder="AB12 CDE"
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    placeholder="Ford"
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="Focus"
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    placeholder="Blue"
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    placeholder="2020"
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addVehicle} disabled={!newVehicle.registration.trim()}>
                  Add Vehicle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Dialog */}
      {showPayment && (
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>Add Vehicle - £3</DialogTitle>
              <DialogDescription>
                Additional vehicles cost £3 each. This allows you to create appeals for multiple vehicles.
              </DialogDescription>
            </DialogHeader>
            <PaymentForm
              appealId=""
              userId={userId}
              paymentType={paymentType}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={(error) => {
                console.error('Payment error:', error);
                setShowPayment(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Vehicles List */}
      {vehicles.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Vehicles Added</h3>
            <p className="text-gray-400 mb-4">
              Add your first vehicle to start creating PCN appeals
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <Car className="h-5 w-5 mr-2" />
                      {vehicle.registration}
                    </CardTitle>
                    <CardDescription>
                      {vehicle.make} {vehicle.model}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {vehicle.is_primary && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                    {!vehicle.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVehicle(vehicle.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  {vehicle.color && <div>Color: {vehicle.color}</div>}
                  {vehicle.year && <div>Year: {vehicle.year}</div>}
                  <div>Added: {new Date(vehicle.created_at).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vehicle Limit Info */}
      {vehicles.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center text-yellow-400">
              <CreditCard className="h-5 w-5 mr-2" />
              <span className="font-medium">Additional Vehicles</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              You can add more vehicles for £3 each. This allows you to create appeals for multiple vehicles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
