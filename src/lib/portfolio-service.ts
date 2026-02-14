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
            const price = currentPrices[asset.symbol] || asset.avgCost;
            return total + (price * asset.quantity);
        }, 0);
    }
};
