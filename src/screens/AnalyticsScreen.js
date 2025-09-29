import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getOrders, getDatabaseStats } from '../database/db';
import { formatCurrency, formatDate, groupBy, sortBy } from '../utils/helpers';

const AnalyticsScreen = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrders(1000); // Get more orders for analytics
      const databaseStats = await getDatabaseStats();

      setOrders(ordersData);
      setStats(databaseStats);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return orders;
    }

    return orders.filter(order => new Date(order.created_at) >= filterDate);
  };

  const calculateAnalytics = () => {
    const filteredOrders = getFilteredOrders();

    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );
    const totalAdvance = filteredOrders.reduce(
      (sum, order) => sum + (order.advance || 0),
      0,
    );
    const totalBalance = filteredOrders.reduce(
      (sum, order) => sum + (order.balance || 0),
      0,
    );
    const averageOrderValue =
      filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Orders by status
    const ordersByStatus = groupBy(filteredOrders, 'sync_status');

    // Recent orders (last 5)
    const recentOrders = sortBy(
      filteredOrders.slice(0, 5),
      'created_at',
      'desc',
    );

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalAdvance,
      totalBalance,
      averageOrderValue,
      ordersByStatus,
      recentOrders,
    };
  };

  const analytics = calculateAnalytics();

  const renderStatCard = (title, value, color = '#2196F3', subtitle = '') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['today', 'week', 'month', 'year'].map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOrderItem = order => (
    <View key={order.id} style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{order.id}</Text>
        <Text style={styles.orderDate}>
          {formatDate(order.created_at, 'short')}
        </Text>
      </View>
      <Text style={styles.customerName}>{order.customer_name}</Text>
      <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Analytics Dashboard</Text>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Orders',
            analytics.totalOrders.toString(),
            '#2196F3',
          )}
          {renderStatCard(
            'Total Revenue',
            formatCurrency(analytics.totalRevenue),
            '#28a745',
          )}
          {renderStatCard(
            'Advance Collected',
            formatCurrency(analytics.totalAdvance),
            '#ffc107',
          )}
          {renderStatCard(
            'Outstanding Balance',
            formatCurrency(analytics.totalBalance),
            '#f44336',
          )}
          {renderStatCard(
            'Average Order Value',
            formatCurrency(analytics.averageOrderValue),
            '#17a2b8',
          )}
        </View>
      </View>

      {/* Orders by Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders by Status</Text>
        <View style={styles.statusContainer}>
          {Object.entries(analytics.ordersByStatus).map(([status, orders]) => (
            <View key={status} style={styles.statusItem}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusName}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                <Text style={styles.statusCount}>{orders.length}</Text>
              </View>
              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusProgress,
                    {
                      width: `${
                        (orders.length / analytics.totalOrders) * 100
                      }%`,
                      backgroundColor:
                        status === 'synced'
                          ? '#28a745'
                          : status === 'pending'
                          ? '#ffc107'
                          : '#f44336',
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {analytics.recentOrders.length > 0 ? (
          analytics.recentOrders.map(renderOrderItem)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No orders found for selected period
            </Text>
          </View>
        )}
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.syncInfo}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Total Orders:</Text>
            <Text style={styles.syncValue}>{stats.orders || 0}</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Pending Sync:</Text>
            <Text style={styles.syncValue}>{stats.pendingSync || 0}</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Synced:</Text>
            <Text style={styles.syncValue}>
              {(stats.orders || 0) - (stats.pendingSync || 0)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  statusContainer: {
    gap: 15,
  },
  statusItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusProgress: {
    height: '100%',
    borderRadius: 3,
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
  },
  syncInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncLabel: {
    fontSize: 14,
    color: '#666',
  },
  syncValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default AnalyticsScreen;
