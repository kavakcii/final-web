import { supabase } from './supabase';

// Types
export interface Asset {
    id: string;
    symbol: string;
    type: "STOCK" | "FUND" | "CRYPTO" | "GOLD";
    quantity: number;
    avgCost: number;
    dateAdded: string; // purchase_date
    userId?: string;
}

export type HistoryRange = '1W' | '1M' | '3M' | 'YTD' | '1Y';

export const PortfolioService = {
    getAssets: async (): Promise<Asset[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_portfolios')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                symbol: item.symbol,
                type: item.asset_type as any,
                quantity: Number(item.quantity),
                avgCost: Number(item.avg_cost),
                dateAdded: item.purchase_date,
                userId: item.user_id
            }));
        } catch (error) {
            console.error('Error fetching assets:', error);
            return [];
        }
    },

    addAsset: async (asset: Omit<Asset, "id">) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase
                .from('user_portfolios')
                .insert([
                    {
                        user_id: user.id,
                        symbol: asset.symbol,
                        asset_type: asset.type,
                        quantity: asset.quantity,
                        avg_cost: asset.avgCost,
                        purchase_date: asset.dateAdded
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                symbol: data.symbol,
                type: data.asset_type as any,
                quantity: Number(data.quantity),
                avgCost: Number(data.avg_cost),
                dateAdded: data.purchase_date
            };
        } catch (error) {
            console.error('Error adding asset:', error);
            throw error;
        }
    },

    removeAsset: async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_portfolios')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing asset:', error);
        }
    },

    updateAsset: async (id: string, updates: Partial<Asset>) => {
        try {
            const dbUpdates: any = {};
            if (updates.avgCost !== undefined) dbUpdates.avg_cost = updates.avgCost;
            if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
            
            const { error } = await supabase
                .from('user_portfolios')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating asset:', error);
            throw error;
        }
    },

    calculateTotalValue: (assets: Asset[], currentPrices: Record<string, number>) => {
        return assets.reduce((total, asset) => {
            const price = currentPrices[asset.symbol.toUpperCase()] || asset.avgCost;
            return total + (price * asset.quantity);
        }, 0);
    },

    saveSnapshot: async (totalValue: number, totalProfit: number, totalCost?: number, assetCount?: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Today's date in YYYY-MM-DD (TSİ)
            const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

            const profitPct = (totalCost && totalCost > 0)
                ? ((totalProfit / totalCost) * 100)
                : 0;

            const snapshotData = {
                total_value: totalValue,
                total_profit: totalProfit,
                total_cost: totalCost ?? 0,
                profit_pct: profitPct,
                asset_count: assetCount ?? 0,
                updated_at: new Date().toISOString()
            };

            // Check if snapshot already exists for today
            const { data: existing } = await supabase
                .from('portfolio_history')
                .select('id')
                .eq('user_id', user.id)
                .eq('snapshot_date', today)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('portfolio_history')
                    .update(snapshotData)
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('portfolio_history')
                    .insert([{ user_id: user.id, snapshot_date: today, ...snapshotData }]);
            }
        } catch (error) {
            console.error('Error saving portfolio snapshot:', error);
        }
    },

    /**
     * Kullanıcıya ait portföy tarihçesini belirtilen zaman aralığına göre çeker.
     * Veriler kullanıcı izolasyonu ile korunur (RLS).
     */
    getHistory: async (range: HistoryRange = '1M'): Promise<any[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // Seçilen zaman dilimine göre başlangıç tarihi hesapla (TSİ)
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
            let fromDate: Date;

            if (range === '1W') {
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - 7);
            } else if (range === '1M') {
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - 30);
            } else if (range === '3M') {
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - 90);
            } else if (range === 'YTD') {
                fromDate = new Date(now.getFullYear(), 0, 1); // 1 Ocak
            } else { // 1Y
                fromDate = new Date(now);
                fromDate.setFullYear(now.getFullYear() - 1);
            }

            const fromDateStr = fromDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

            const { data, error } = await supabase
                .from('portfolio_history')
                .select('snapshot_date, total_value, total_profit, profit_pct, asset_count')
                .eq('user_id', user.id)
                .gte('snapshot_date', fromDateStr)
                .order('snapshot_date', { ascending: true });

            if (error) throw error;
            return data ?? [];
        } catch (error) {
            console.error('Error fetching portfolio history:', error);
            return [];
        }
    },

    /**
     * İlk kayıt tarihini döndürür → kaç günlük veri var bilgisi için
     */
    getFirstSnapshotDate: async (): Promise<string | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data } = await supabase
                .from('portfolio_history')
                .select('snapshot_date')
                .eq('user_id', user.id)
                .order('snapshot_date', { ascending: true })
                .limit(1)
                .maybeSingle();

            return data?.snapshot_date ?? null;
        } catch {
            return null;
        }
    }
};
