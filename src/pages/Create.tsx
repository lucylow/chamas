import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useLocation } from 'wouter';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  DollarSign, 
  Users, 
  Calendar,
  FileText,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHAMA_FACTORY_ABI } from '@/lib/abi/chamaFactory';
import { CONTRACTS, DEFAULT_CHAIN_ID } from '@/lib/constants';
import { parseUnits } from 'viem';

interface CreateProps {
  language: 'sw' | 'en';
}

// Frequency constants (in seconds)
const WEEKLY = 7 * 24 * 60 * 60; // 7 days
const MONTHLY = 30 * 24 * 60 * 60; // 30 days

export default function Create({ language }: CreateProps) {
  const [location, setLocation] = useLocation();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameSwahili: '',
    description: '',
    descriptionSwahili: '',
    contributionAmount: '',
    frequency: 'monthly' as 'weekly' | 'monthly',
    maxMembers: '',
    tokenAddress: CONTRACTS.USDC || '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const isValidChain = currentChainId === (CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID);
  const factoryAddress = CONTRACTS.FACTORY as `0x${string}` | undefined;

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && txHash && !showSuccess) {
      setShowSuccess(true);
    }
  }, [isConfirmed, txHash, showSuccess]);

  const text = {
    title: language === 'sw' ? 'Unda Chama Kipya' : 'Create New Chama',
    subtitle: language === 'sw' 
      ? 'Jaza fomu hapa chini kuunda chama kipya'
      : 'Fill out the form below to create a new chama',
    name: language === 'sw' ? 'Jina (Kiingereza)' : 'Name (English)',
    nameSwahili: language === 'sw' ? 'Jina (Kiswahili)' : 'Name (Swahili)',
    description: language === 'sw' ? 'Maelezo (Kiingereza)' : 'Description (English)',
    descriptionSwahili: language === 'sw' ? 'Maelezo (Kiswahili)' : 'Description (Swahili)',
    contributionAmount: language === 'sw' ? 'Kiasi cha Mchango (USDC)' : 'Contribution Amount (USDC)',
    frequency: language === 'sw' ? 'Mzunguko wa Michango' : 'Contribution Frequency',
    weekly: language === 'sw' ? 'Kila Wiki (Weekly)' : 'Weekly',
    monthly: language === 'sw' ? 'Kila Mwezi (Monthly)' : 'Monthly',
    maxMembers: language === 'sw' ? 'Idadi ya Juu ya Wanachama' : 'Maximum Members',
    tokenAddress: language === 'sw' ? 'Anwani ya Token' : 'Token Address',
    create: language === 'sw' ? 'Unda Chama' : 'Create Chama',
    cancel: language === 'sw' ? 'Ghairi' : 'Cancel',
    back: language === 'sw' ? 'Rudi' : 'Back',
    connecting: language === 'sw' ? 'Inaunganisha...' : 'Connecting...',
    creating: language === 'sw' ? 'Inaunda chama...' : 'Creating chama...',
    confirming: language === 'sw' ? 'Inathibitisha muamala...' : 'Confirming transaction...',
    success: language === 'sw' ? 'Chama kimeundwa kwa mafanikio!' : 'Chama created successfully!',
    successMessage: language === 'sw' 
      ? 'Chama chako kimeundwa. Unaweza kukiona kwenye orodha ya chamas.'
      : 'Your chama has been created. You can view it in the chamas list.',
    viewChamas: language === 'sw' ? 'Angalia Chamas' : 'View Chamas',
    errors: {
      wallet: language === 'sw' 
        ? 'Tafadhali unganisha mkoba wako kwanza' 
        : 'Please connect your wallet first',
      chain: language === 'sw'
        ? `Tafadhali badilisha kwa Sepolia network (Chain ID: ${CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID})`
        : `Please switch to Sepolia network (Chain ID: ${CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID})`,
      factory: language === 'sw'
        ? 'Anwani ya factory haipo. Tafadhali angalia mipangilio.'
        : 'Factory address missing. Please check settings.',
      required: language === 'sw' 
        ? 'Sehemu hii ni lazima' 
        : 'This field is required',
      invalidAmount: language === 'sw'
        ? 'Kiasi lazima kiwe namba halali zaidi ya sifuri'
        : 'Amount must be a valid number greater than zero',
      invalidMembers: language === 'sw'
        ? 'Idadi ya wanachama lazima iwe angalau 2'
        : 'Number of members must be at least 2',
      invalidAddress: language === 'sw'
        ? 'Anwani ya token si halali'
        : 'Invalid token address',
    },
    help: {
      name: language === 'sw' 
        ? 'Jina la chama kwa Kiingereza' 
        : 'The name of your chama in English',
      nameSwahili: language === 'sw'
        ? 'Jina la chama kwa Kiswahili'
        : 'The name of your chama in Swahili',
      description: language === 'sw'
        ? 'Maelezo mafupi ya chama kwa Kiingereza'
        : 'A brief description of your chama in English',
      descriptionSwahili: language === 'sw'
        ? 'Maelezo mafupi ya chama kwa Kiswahili'
        : 'A brief description of your chama in Swahili',
      contributionAmount: language === 'sw'
        ? 'Kiasi cha mchango kila mwanachama atachangia (kwa USDC)'
        : 'The amount each member will contribute (in USDC)',
      frequency: language === 'sw'
        ? 'Mzunguko wa michango: kila wiki au kila mwezi'
        : 'How often members contribute: weekly or monthly',
      maxMembers: language === 'sw'
        ? 'Idadi ya juu ya wanachama wanaoweza kujiunga na chama'
        : 'The maximum number of members who can join the chama',
      tokenAddress: language === 'sw'
        ? 'Anwani ya token ya ERC20 itakayotumika kwa michango'
        : 'The ERC20 token address to be used for contributions',
    },
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = text.errors.required;
    }
    if (!formData.nameSwahili.trim()) {
      newErrors.nameSwahili = text.errors.required;
    }
    if (!formData.description.trim()) {
      newErrors.description = text.errors.required;
    }
    if (!formData.descriptionSwahili.trim()) {
      newErrors.descriptionSwahili = text.errors.required;
    }
    if (!formData.contributionAmount.trim()) {
      newErrors.contributionAmount = text.errors.required;
    } else {
      const amount = parseFloat(formData.contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.contributionAmount = text.errors.invalidAmount;
      }
    }
    if (!formData.maxMembers.trim()) {
      newErrors.maxMembers = text.errors.required;
    } else {
      const members = parseInt(formData.maxMembers, 10);
      if (isNaN(members) || members < 2) {
        newErrors.maxMembers = text.errors.invalidMembers;
      }
    }
    if (!formData.tokenAddress.trim() || !/^0x[a-fA-F0-9]{40}$/.test(formData.tokenAddress)) {
      newErrors.tokenAddress = text.errors.invalidAddress;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate wallet connection
    if (!isConnected || !address) {
      setError(text.errors.wallet);
      return;
    }

    if (!isValidChain) {
      setError(text.errors.chain);
      return;
    }

    if (!factoryAddress) {
      setError(text.errors.factory);
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Convert amount to wei (USDC has 6 decimals)
      const amountInWei = parseUnits(formData.contributionAmount, 6);
      
      // Convert frequency to seconds
      const frequencyInSeconds = formData.frequency === 'weekly' ? BigInt(WEEKLY) : BigInt(MONTHLY);
      
      // Combine name and description (using English version for now, can be extended)
      const combinedName = formData.name;
      const combinedDescription = formData.description;

      // Call the createChama function
      const hash = await writeContractAsync({
        address: factoryAddress,
        abi: CHAMA_FACTORY_ABI,
        functionName: 'createChama',
        args: [
          combinedName,
          combinedDescription,
          amountInWei,
          frequencyInSeconds,
          formData.tokenAddress as `0x${string}`,
          BigInt(formData.maxMembers),
        ],
      });

      setTxHash(hash);
    } catch (err: any) {
      console.error('Error creating chama:', err);
      const errorMessage = err?.shortMessage || err?.message || (language === 'sw' 
        ? 'Imeshindikana kuunda chama' 
        : 'Failed to create chama');
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };


  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
        <div className="container px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                {text.success}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                {text.successMessage}
              </p>
              {txHash && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {language === 'sw' ? 'Nambari ya Muamala:' : 'Transaction Hash:'}
                  </p>
                  <p className="text-xs sm:text-sm font-mono text-foreground break-all">
                    {txHash}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => setLocation('/chamas')}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {text.viewChamas}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowSuccess(false);
                    setTxHash(null);
                    setFormData({
                      name: '',
                      nameSwahili: '',
                      description: '',
                      descriptionSwahili: '',
                      contributionAmount: '',
                      frequency: 'monthly',
                      maxMembers: '',
                      tokenAddress: CONTRACTS.USDC || '',
                    });
                  }}
                >
                  {language === 'sw' ? 'Unda Chama Jengine' : 'Create Another'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      <div className="container px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/chamas')}
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {text.back}
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                {text.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {text.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-border/50 shadow-lg p-6 sm:p-8 space-y-6">
              {/* Wallet Connection Status */}
              {!isConnected && (
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-yellow-300/50 bg-gradient-to-r from-yellow-50/90 to-yellow-50/50">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-900 font-medium">
                    {text.errors.wallet}
                  </p>
                </div>
              )}

              {!isValidChain && isConnected && (
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-red-300/50 bg-gradient-to-r from-red-50/90 to-red-50/50">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900 font-medium">
                    {text.errors.chain}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-red-300/50 bg-gradient-to-r from-red-50/90 to-red-50/50">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900 font-medium">{error}</p>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {text.name}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    placeholder={language === 'sw' ? 'Mfano: Nairobi Women Group' : 'Example: Nairobi Women Group'}
                    className={`h-12 ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isCreating || isConfirming}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="nameSwahili" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {text.nameSwahili}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="nameSwahili"
                    type="text"
                    value={formData.nameSwahili}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('nameSwahili', e.target.value)}
                    placeholder={language === 'sw' ? 'Mfano: Kikundi cha Wanawake Nairobi' : 'Example: Kikundi cha Wanawake Nairobi'}
                    className={`h-12 ${errors.nameSwahili ? 'border-red-500' : ''}`}
                    disabled={isCreating || isConfirming}
                  />
                  {errors.nameSwahili && (
                    <p className="text-xs text-red-600">{errors.nameSwahili}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.nameSwahili}
                  </p>
                </div>
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {text.description}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    placeholder={language === 'sw' ? 'Maelezo ya chama kwa Kiingereza...' : 'Describe your chama in English...'}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none ${errors.description ? 'border-red-500' : ''}`}
                    disabled={isCreating || isConfirming}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="descriptionSwahili" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {text.descriptionSwahili}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="descriptionSwahili"
                    value={formData.descriptionSwahili}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('descriptionSwahili', e.target.value)}
                    placeholder={language === 'sw' ? 'Maelezo ya chama kwa Kiswahili...' : 'Describe your chama in Swahili...'}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none ${errors.descriptionSwahili ? 'border-red-500' : ''}`}
                    disabled={isCreating || isConfirming}
                  />
                  {errors.descriptionSwahili && (
                    <p className="text-xs text-red-600">{errors.descriptionSwahili}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.descriptionSwahili}
                  </p>
                </div>
              </div>

              {/* Contribution Amount */}
              <div className="space-y-2">
                <label htmlFor="contributionAmount" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {text.contributionAmount}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="contributionAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.contributionAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('contributionAmount', e.target.value)}
                  placeholder={language === 'sw' ? 'Mfano: 10.00' : 'Example: 10.00'}
                  className={`h-12 ${errors.contributionAmount ? 'border-red-500' : ''}`}
                  disabled={isCreating || isConfirming}
                />
                {errors.contributionAmount && (
                  <p className="text-xs text-red-600">{errors.contributionAmount}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {text.help.contributionAmount}
                </p>
              </div>

              {/* Frequency and Max Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="frequency" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {text.frequency}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('frequency', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    disabled={isCreating || isConfirming}
                  >
                    <option value="weekly">{text.weekly}</option>
                    <option value="monthly">{text.monthly}</option>
                  </select>
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.frequency}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxMembers" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {text.maxMembers}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    value={formData.maxMembers}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('maxMembers', e.target.value)}
                    placeholder={language === 'sw' ? 'Mfano: 20' : 'Example: 20'}
                    className={`h-12 ${errors.maxMembers ? 'border-red-500' : ''}`}
                    disabled={isCreating || isConfirming}
                  />
                  {errors.maxMembers && (
                    <p className="text-xs text-red-600">{errors.maxMembers}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {text.help.maxMembers}
                  </p>
                </div>
              </div>

              {/* Token Address */}
              <div className="space-y-2">
                <label htmlFor="tokenAddress" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {text.tokenAddress}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tokenAddress"
                  type="text"
                  value={formData.tokenAddress}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('tokenAddress', e.target.value)}
                  placeholder="0x..."
                  className={`h-12 font-mono text-sm ${errors.tokenAddress ? 'border-red-500' : ''}`}
                  disabled={isCreating || isConfirming}
                />
                {errors.tokenAddress && (
                  <p className="text-xs text-red-600">{errors.tokenAddress}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {text.help.tokenAddress}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setLocation('/chamas')}
                disabled={isCreating || isConfirming}
                className="w-full sm:w-auto"
              >
                {text.cancel}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!isConnected || !isValidChain || isCreating || isConfirming}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {(isCreating || isConfirming) ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isConfirming ? text.confirming : text.creating}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    {text.create}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

