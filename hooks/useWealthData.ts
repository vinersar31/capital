import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Asset, Liability } from '../types';

const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'Apartment', category: 'real_estate', currentValue: 250000 },
  { id: '2', name: 'Romanian Govt Bonds (Fidelis)', category: 'government_bonds', currentValue: 50000 },
  { id: '3', name: 'Defense Sector ETF', category: 'equities', currentValue: 75000, ticker: 'ITA' },
  { id: '4', name: 'High Yield Savings', category: 'cash', currentValue: 25000 },
];

const MOCK_LIABILITIES: Liability[] = [
  { id: '1', name: 'Apartment Mortgage', category: 'mortgage', currentValue: 120000 },
];

export function useWealthData() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assetsQuery = query(collection(db, 'assets'));
    const liabilitiesQuery = query(collection(db, 'liabilities'));

    let isMounted = true;

    const unsubscribeAssets = onSnapshot(
      assetsQuery,
      (snapshot) => {
        if (!isMounted) return;
        const fetchedAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        if (fetchedAssets.length > 0) {
            setAssets(fetchedAssets);
        } else {
            setAssets(MOCK_ASSETS);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching assets', error);
        if (isMounted) {
            setAssets(MOCK_ASSETS);
            setLoading(false);
        }
      }
    );

    const unsubscribeLiabilities = onSnapshot(
      liabilitiesQuery,
      (snapshot) => {
        if (!isMounted) return;
        const fetchedLiabilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability));
        if (fetchedLiabilities.length > 0) {
             setLiabilities(fetchedLiabilities);
        } else {
             setLiabilities(MOCK_LIABILITIES);
        }
      },
      (error) => {
        console.error('Error fetching liabilities', error);
         if (isMounted) {
            setLiabilities(MOCK_LIABILITIES);
         }
      }
    );

    return () => {
      isMounted = false;
      unsubscribeAssets();
      unsubscribeLiabilities();
    };
  }, []);

  const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.currentValue, 0);
  const netWorth = totalAssets - totalLiabilities;

  return {
    assets,
    liabilities,
    loading,
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}
