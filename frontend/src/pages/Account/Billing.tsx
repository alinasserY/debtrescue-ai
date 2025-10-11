import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
  Zap,
  Users,
  Shield,
  X,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  name: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

export default function Billing() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      interval: 'month',
      features: [
        'Up to 3 active negotiations',
        'AI-powered negotiation drafts',
        'Email support',
        'Basic debt tracking',
        'Monthly progress reports',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 79,
      interval: 'month',
      popular: true,
      features: [
        'Unlimited negotiations',
        'Advanced AI strategies',
        'Priority support (24/7)',
        'Advanced analytics dashboard',
        'Custom negotiation templates',
        'Document OCR & parsing',
        'Settlement tracking',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      interval: 'month',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'White-label options',
        'API access',
        'Custom integrations',
        'Legal consultation (2hrs/month)',
        'Team collaboration tools',
      ],
    },
  ];

  useEffect(() => {
    // TODO: Fetch payment methods and invoices from API
    // Mock data for now
    setPaymentMethods([]);
    setInvoices([]);
  }, []);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(formatExpiryDate(value));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Integrate with Stripe
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newCard: PaymentMethod = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'card',
        brand: 'Visa',
        last4: cardNumber.replace(/\s/g, '').slice(-4),
        expiryMonth: parseInt(expiryDate.split('/')[0]),
        expiryYear: parseInt('20' + expiryDate.split('/')[1]),
        isDefault: paymentMethods.length === 0,
        name: cardName,
      };

      setPaymentMethods([...paymentMethods, newCard]);
      setSuccess('Payment method added successfully');
      setShowAddCard(false);
      
      // Reset form
      setCardNumber('');
      setCardName('');
      setExpiryDate('');
      setCvv('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    setIsLoading(true);
    try {
      // TODO: Call API to remove payment method
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
      setSuccess('Payment method removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to remove payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      // TODO: Call API to set default payment method
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setPaymentMethods(
        paymentMethods.map((pm) => ({ ...pm, isDefault: pm.id === id }))
      );
      setSuccess('Default payment method updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update default payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeToPlan = async (planId: string) => {
    if (!paymentMethods.length) {
      setError('Please add a payment method first');
      setShowPlans(false);
      setShowAddCard(true);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to create subscription
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setCurrentPlan(planId);
      setSuccess('Successfully subscribed to ' + plans.find((p) => p.id === planId)?.name);
      setShowPlans(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to subscribe to plan');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardBrandLogo = (brand: string) => {
    const logos: { [key: string]: string } = {
      Visa: '💳',
      Mastercard: '💳',
      Amex: '💳',
      Discover: '💳',
    };
    return logos[brand] || '💳';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, payment methods, and invoices
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Subscription */}
      {currentPlan ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">
                  {plans.find((p) => p.id === currentPlan)?.name} Plan
                </h2>
              </div>
              <p className="text-3xl font-bold mb-1">
                ${plans.find((p) => p.id === currentPlan)?.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">Next billing date: Dec 1, 2025</p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowPlans(true)}>
                  Change Plan
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  Cancel Subscription
                </Button>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Active
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-12 mb-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Unlock powerful AI-driven debt negotiation features and save thousands on your debt
          </p>
          <Button size="lg" onClick={() => setShowPlans(true)}>
            <Zap className="w-5 h-5 mr-2" />
            View Plans & Pricing
          </Button>
        </motion.div>
      )}

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Payment Methods</h2>
          <Button onClick={() => setShowAddCard(true)} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No payment methods added yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowAddCard(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first card
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {getCardBrandLogo(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {method.brand} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                    </p>
                    <p className="text-sm text-muted-foreground">{method.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={isLoading}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCard(method.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <h2 className="text-lg font-semibold mb-6">Billing History</h2>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No invoices yet</p>
            <p className="text-xs mt-2">Your invoices will appear here once you subscribe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium mb-1">{invoice.description}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold">${invoice.amount}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3"
      >
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Secure Payments by Stripe</p>
          <p>
            All payments are processed securely through Stripe. We never store your card details on
            our servers. Your payment information is encrypted and PCI-compliant.
          </p>
        </div>
      </motion.div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isLoading && setShowAddCard(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Add Payment Method</h3>
                    <p className="text-sm text-muted-foreground">Enter your card details</p>
                  </div>
                </div>
                <button
                  onClick={() => !isLoading && setShowAddCard(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCard}>
                <div className="p-6 space-y-4">
                  {/* Cardholder Name */}
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium mb-2">
                      Cardholder Name
                    </label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Card Number */}
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                      Card Number
                    </label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      disabled={isLoading}
                      icon={<CreditCard className="w-5 h-5" />}
                    />
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium mb-2">
                        Expiry Date
                      </label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        required
                        disabled={isLoading}
                        icon={<Calendar className="w-5 h-5" />}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium mb-2">
                        CVV
                      </label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Your card details are encrypted and processed securely by Stripe. We never
                      store your card information.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddCard(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} isLoading={isLoading}>
                    {isLoading ? 'Adding Card...' : 'Add Card'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Modal */}
      <AnimatePresence>
        {showPlans && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => !isLoading && setShowPlans(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-5xl w-full my-8"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Choose Your Plan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select the perfect plan for your debt relief journey
                  </p>
                </div>
                <button
                  onClick={() => !isLoading && setShowPlans(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative bg-card border-2 rounded-xl p-6 flex flex-col ${
                        plan.popular
                          ? 'border-primary shadow-lg shadow-primary/20'
                          : 'border-border'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-lg">
                            <Zap className="w-3 h-3 mr-1" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                        <div className="mb-4">
                          <span className="text-4xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/{plan.interval}</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleSubscribeToPlan(plan.id)}
                        disabled={isLoading || currentPlan === plan.id}
                      >
                        {currentPlan === plan.id ? 'Current Plan' : `Choose ${plan.name}`}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Features Comparison */}
                <div className="mt-8 p-6 bg-muted/30 rounded-xl">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    All Plans Include
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Bank-level encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>GDPR compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>30-day money back</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>No hidden fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Free updates</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}