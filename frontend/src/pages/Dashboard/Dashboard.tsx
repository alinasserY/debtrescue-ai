import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  TrendingUp,
  FileText,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Total Debt',
      value: '$0',
      change: null,
      icon: CreditCard,
      color: 'blue',
    },
    {
      label: 'Total Saved',
      value: '$0',
      change: null,
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Active Negotiations',
      value: '0',
      change: null,
      icon: FileText,
      color: 'purple',
    },
    {
      label: 'Success Rate',
      value: '0%',
      change: null,
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const quickActions = [
    {
      title: 'Link Your Accounts',
      description: 'Connect your credit cards and loans to get started',
      icon: CreditCard,
      color: 'bg-blue-500',
      onClick: () => navigate('/accounts/link'),
    },
    {
      title: 'Start First Negotiation',
      description: 'Let AI help you reduce your debt payments',
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => navigate('/negotiations/create'),
    },
    {
      title: 'Upload Documents',
      description: 'Add statements and creditor correspondence',
      icon: FileText,
      color: 'bg-green-500',
      onClick: () => navigate('/documents'),
    },
  ];

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your debt relief dashboard. Let's help you become debt-free.
        </p>
      </motion.div>

      {/* Email Verification Warning */}
      {!user?.emailVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ <strong>Action required:</strong> Please verify your email address to access all
            features. Check your inbox for the verification link.
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-card border border-border rounded-xl p-6 text-left hover:shadow-lg transition-all hover:scale-105"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Get started <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>

        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No activity yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Start by linking your accounts to see your debt activity here
          </p>
          <Button onClick={() => navigate('/accounts/link')}>Link Your Accounts</Button>
        </div>
      </motion.div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-border rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Debt Freedom Journey</h2>
            <p className="text-sm text-muted-foreground">
              Complete these steps to maximize your savings
            </p>
          </div>
          <span className="text-2xl font-bold text-primary">0/5</span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Complete your profile', done: false, link: '/account/profile' },
            { label: 'Link your accounts', done: false, link: '/accounts/link' },
            { label: 'Upload debt statements', done: false, link: '/documents' },
            { label: 'Start first negotiation', done: false, link: '/negotiations/create' },
            { label: 'Enable two-factor authentication', done: false, link: '/account/security' },
          ].map((step, index) => (
            <button
              key={index}
              onClick={() => navigate(step.link)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    step.done
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground bg-background'
                  }`}
                >
                  {step.done && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className={step.done ? 'line-through text-muted-foreground' : ''}>
                  {step.label}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}