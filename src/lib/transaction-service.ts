import { supabase } from './supabase';
import { UserTransaction } from './finai-analytics-engine';

export const TransactionService = {
    /**
     * Kullanıcının tüm sermaye hareketlerini ve işlemlerini getirir.
     */
    getTransactions: async (daysLimit: number = 30): Promise<UserTransaction[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - daysLimit);
            const fromDateStr = fromDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

            const { data, error } = await supabase
                .from('user_transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('transaction_date', fromDateStr)
                .order('transaction_date', { ascending: true });

            if (error || !data) return [];

            return data.map((t: any) => ({
                id: t.id,
                userId: t.user_id,
                type: t.transaction_type,
                symbol: t.symbol,
                quantity: t.quantity ? Number(t.quantity) : undefined,
                price: t.price ? Number(t.price) : undefined,
                amount: Number(t.amount),
                transactionDate: t.transaction_date
            }));
        } catch {
            return [];
        }
    },

    /**
     * Yeni işlem veya sermaye hareketi ekler.
     */
    addTransaction: async (tx: Omit<UserTransaction, 'id' | 'userId'>): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

            const { error } = await supabase
                .from('user_transactions')
                .insert([{
                    user_id: user.id,
                    transaction_type: tx.type,
                    symbol: tx.symbol,
                    quantity: tx.quantity,
                    price: tx.price,
                    amount: tx.amount,
                    transaction_date: tx.transactionDate || todayStr
                }]);

            if (error) {
                console.error("Error adding transaction:", error);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }
};
