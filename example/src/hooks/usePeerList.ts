import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { Peer } from '../entities';
import { type PeerEventHandlers, PeerRepository } from '../repositories';
import { GetPeersUseCase } from '../usecases';

export const usePeerList = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const repositoryRef = useRef(new PeerRepository());
  const repository = repositoryRef.current;

  const getPeersUseCase = new GetPeersUseCase(repository);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Initializing peer list hook');

        // Cargar peers inicial
        const initialPeers = await getPeersUseCase.execute();
        setPeers(initialPeers);

        // Suscribirse a eventos
        const eventHandlers: PeerEventHandlers = {
          onPeerConnect: (userId: string) => {
            console.log('Peer connected event:', userId);
          },
          onPeerDisconnect: (userId: string) => {
            console.log('Peer disconnected event:', userId);
          },
          onSecureConnection: (userId: string) => {
            console.log('Secure connection event:', userId);
          },
          onPeersUpdated: (updatedPeers) => {
            setPeers(updatedPeers);
          },
          onError: (err) => {
            setError(err);
          },
        };

        repository.subscribeToEvents(eventHandlers);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const error =
          err instanceof Error ? err : new Error('Failed to load peers');
        setError(error);
        console.error('Hook initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();

    return () => {
      repository.unsubscribeFromEvents();
    };
  }, []);

  const loadPeers = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const updatedPeers = await getPeersUseCase.execute();
      setPeers(updatedPeers);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const error =
        err instanceof Error ? err : new Error('Failed to refresh peers');
      setError(error);
      Alert.alert('Error', 'Failed to load peers. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getConnectedPeersCount = (): number => {
    return peers.filter(
      (p) => p.status === 'connected' || p.status === 'secure'
    ).length;
  };

  return {
    peers,
    loading,
    refreshing,
    error,
    loadPeers,
    getConnectedPeersCount,
  };
};
