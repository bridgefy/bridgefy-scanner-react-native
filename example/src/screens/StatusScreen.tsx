import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSDKStatus } from '../hooks/useSDKStatus';
import { StatusCard } from '../components/StatusCard';
import { InfoCard } from '../components/InfoCard';
import { ControlButton } from '../components/ControlButton';
import { PeersList } from '../components/PeersList';
import { statusStyles } from '../styles';

export default function StatusScreen() {
  const { status, error, checkStatus, initialize, start, stop } =
    useSDKStatus();

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error.message);
    }
  });

  return (
    <View style={statusStyles.container}>
      <ScrollView style={statusStyles.content}>
        <Text style={statusStyles.sectionTitle}>{'Status'}</Text>
        <View style={statusStyles.statusCard}>
          {/* Status Cards */}
          <StatusCard title="Initialized" isActive={status.isInitialized} />
          <StatusCard title="Started" isActive={status.isStarted} />

          {/* Info Cards */}
          {status.isStarted && (
            <InfoCard
              label="Your User ID"
              value={status.userId}
              icon="identifier"
            />
          )}

          {/* Connected Peers */}
          {status.isStarted && status.connectedPeers.length > 0 && (
            <InfoCard
              label="Connected Peers"
              value={status.connectedPeers.length.toString()}
              icon="lan-connect"
            />
          )}
        </View>
        {/* Control Buttons */}
        <View style={statusStyles.controlsSection}>
          <Text style={statusStyles.sectionTitle}>{'Controls'}</Text>

          {!status.isInitialized && (
            <ControlButton
              title="Initialize SDK"
              icon="power"
              onPress={initialize}
              loading={status.loading}
              variant="init"
            />
          )}

          {status.isInitialized && !status.isStarted && (
            <ControlButton
              title="Start SDK"
              icon="play"
              onPress={start}
              loading={status.loading}
              variant="start"
            />
          )}

          {status.isStarted && (
            <ControlButton
              title="Stop SDK"
              icon="stop"
              onPress={stop}
              loading={status.loading}
              variant="stop"
            />
          )}

          <ControlButton
            title="Refresh Status"
            icon="refresh"
            onPress={checkStatus}
            loading={status.loading}
            variant="refresh"
          />
        </View>
        {/* Peers List */}
        <PeersList peers={status.connectedPeers} />
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
