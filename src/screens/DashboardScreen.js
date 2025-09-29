import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getOrders, getDatabaseStats } from '../database/db';
import { useSync } from '../hooks/useSync';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { isOnline, lastSync, performSync } = useSync();
  const { getThemeColors } = useTheme();

  const colors = getThemeColors();

  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ orders: 0, pendingSync: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [orders, databaseStats] = await Promise.all([
        getOrders(10), // Get last 10 orders
        getDatabaseStats(),
      ]);

      setRecentOrders(orders);
      setStats(databaseStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      const result = await performSync(true);
      if (result.success) {
        Alert.alert('Success', 'Sync completed successfully!');
        loadDashboardData();
      } else {
        Alert.alert('Error', 'Sync failed: ' + result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed: ' + error.message);
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.orderItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.text }]}>{item.id}</Text>
        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at, 'short')}
        </Text>
      </View>
      <Text style={[styles.customerName, { color: colors.text }]}>
        {item.customer_name}
      </Text>
      <View style={styles.orderFooter}>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          {formatCurrency(item.total)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.sync_status === 'synced'
              ? [styles.syncedBadge, { backgroundColor: colors.success }]
              : item.sync_status === 'pending'
              ? [styles.pendingBadge, { backgroundColor: colors.warning }]
              : [styles.failedBadge, { backgroundColor: colors.error }],
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.sync_status === 'synced'
                ? [styles.syncedText, { color: '#fff' }]
                : item.sync_status === 'pending'
                ? [styles.pendingText, { color: '#fff' }]
                : [styles.failedText, { color: '#fff' }],
            ]}
          >
            {item.sync_status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderQuickAction = (title, icon, onPress, color = '#2196F3') => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>GarmentPOS Dashboard</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {stats.orders}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Total Orders
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>
            {stats.pendingSync}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Pending Sync
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {recentOrders.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Recent Orders
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          {renderQuickAction('New Order', '📝', () =>
            navigation.navigate('NewOrder'),
          )}
          {renderQuickAction('Orders', '📋', () =>
            navigation.navigate('OrdersList'),
          )}
          {renderQuickAction('Settings', '⚙️', () =>
            navigation.navigate('Settings'),
          )}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentOrdersContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Orders
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('OrdersList')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length > 0 ? (
          <FlatList
            data={recentOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              No orders yet
            </Text>
            <TouchableOpacity
              style={[
                styles.createOrderButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('NewOrder')}
            >
              <Text style={styles.createOrderButtonText}>
                Create First Order
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  settingsIcon: {
    fontSize: 20,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  onlineIndicator: {
    backgroundColor: '#28a745',
  },
  offlineIndicator: {
    backgroundColor: '#dc3545',
  },
  syncText: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  syncContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  syncButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncInfo: {
    fontSize: 14,
    color: '#666',
  },
  recentOrdersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncedBadge: {
    backgroundColor: '#d4edda',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  failedBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  syncedText: {
    color: '#155724',
  },
  pendingText: {
    color: '#856404',
  },
  failedText: {
    color: '#721c24',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  createOrderButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
