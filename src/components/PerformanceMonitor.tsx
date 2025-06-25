import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  tps: number;
  players: number;
}

const PerformanceMonitor: React.FC = () => {
  const { api } = useElectron();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [currentStats, setCurrentStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    tps: 20,
    players: 0,
    uptime: '0h 0m',
    chunks: 0,
    entities: 0
  });

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'info',
      message: 'Performance monitoring started',
      timestamp: new Date().toISOString(),
      resolved: true
    }
  ]);

  // Load performance data
  useEffect(() => {
    const loadStats = async () => {
      if (!api) {
        // Dados simulados para versão web
        const mockStats = {
          cpu: Math.random() * 50 + 10,
          memory: Math.random() * 60 + 20,
          disk: Math.random() * 30 + 10,
          network: Math.random() * 20 + 5,
          tps: 19.5 + Math.random() * 0.5,
          players: Math.floor(Math.random() * 3),
          uptime: '0h 0m',
          chunks: Math.floor(Math.random() * 1000) + 500,
          entities: Math.floor(Math.random() * 500) + 200
        };
        setCurrentStats(mockStats);
        
        const newData: PerformanceData = {
          timestamp: new Date().toISOString(),
          ...mockStats
        };
        setPerformanceData(prev => [...prev.slice(-29), newData]);
        return;
      }
      
      try {
        const stats = await api.performance.getStats();
        if (stats) {
          setCurrentStats(stats);
          
          const newData: PerformanceData = {
            timestamp: new Date().toISOString(),
            cpu: stats.cpu,
            memory: stats.memory,
            disk: stats.disk,
            network: stats.network,
            tps: stats.tps,
            players: stats.players
          };
          
          setPerformanceData(prev => [...prev.slice(-29), newData]);

          // Verificar alertas
          checkAlerts(stats);
        }
      } catch (error) {
        console.error('Failed to load performance stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  const checkAlerts = (stats: any) => {
    const newAlerts = [];

    if (stats.cpu > 90) {
      newAlerts.push({
        id: Date.now(),
        type: 'error',
        message: `High CPU usage detected: ${stats.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    } else if (stats.cpu > 70) {
      newAlerts.push({
        id: Date.now(),
        type: 'warning',
        message: `Elevated CPU usage: ${stats.cpu.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    if (stats.memory > 95) {
      newAlerts.push({
        id: Date.now(),
        type: 'error',
        message: `Critical memory usage: ${stats.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    } else if (stats.memory > 80) {
      newAlerts.push({
        id: Date.now(),
        type: 'warning',
        message: `High memory usage: ${stats.memory.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    if (stats.tps < 15) {
      newAlerts.push({
        id: Date.now(),
        type: 'error',
        message: `Low TPS detected: ${stats.tps.toFixed(1)}`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    } else if (stats.tps < 18) {
      newAlerts.push({
        id: Date.now(),
        type: 'warning',
        message: `TPS below optimal: ${stats.tps.toFixed(1)}`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 dark:text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (value >= thresholds.warning) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Monitor
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time server performance metrics and alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Monitoring
          </div>
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              {getStatusIcon(currentStats.cpu, { warning: 70, critical: 90 })}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStats.cpu.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              CPU Usage
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStats.cpu >= 90 ? 'bg-red-500' :
                  currentStats.cpu >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(currentStats.cpu, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              {getStatusIcon(currentStats.memory, { warning: 80, critical: 95 })}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStats.memory.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Memory Usage
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStats.memory >= 95 ? 'bg-red-500' :
                  currentStats.memory >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(currentStats.memory, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {getStatusIcon(20 - currentStats.tps, { warning: 2, critical: 5 })}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStats.tps.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              TPS (Ticks/Second)
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStats.tps < 15 ? 'bg-red-500' :
                  currentStats.tps < 18 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(Math.min(currentStats.tps, 20) / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStats.players}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Active Players
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Uptime: {currentStats.uptime}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <LineChart className="w-6 h-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resource Usage Over Time
            </h4>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-1">
            {performanceData.slice(-20).map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-300"
                    style={{ height: `${(data.cpu / 100) * 200}px` }}
                    title={`CPU: ${data.cpu.toFixed(1)}%`}
                  />
                  <div 
                    className="absolute bottom-0 w-full bg-green-500 opacity-70 rounded-t transition-all duration-300"
                    style={{ height: `${(data.memory / 100) * 200}px` }}
                    title={`Memory: ${data.memory.toFixed(1)}%`}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(data.timestamp).toLocaleTimeString().slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Statistics
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loaded Chunks
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentStats.chunks.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Entities
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentStats.entities.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Average TPS
              </span>
              <span className={`text-sm font-bold ${
                currentStats.tps >= 18 ? 'text-green-600 dark:text-green-400' :
                currentStats.tps >= 15 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {currentStats.tps.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Disk Usage
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentStats.disk.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Network Usage
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentStats.network.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Warnings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Alerts
          </h4>
        </div>
        
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${
              alert.type === 'warning' 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : alert.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            } ${alert.resolved ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : alert.type === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                      alert.type === 'error' ? 'text-red-800 dark:text-red-300' :
                      'text-blue-800 dark:text-blue-300'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {alert.resolved && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;