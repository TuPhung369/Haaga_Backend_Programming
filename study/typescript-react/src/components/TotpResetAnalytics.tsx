import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
import {
  fetchTotpResetAnalytics,
  TotpResetStats,
} from "../services/totpAdminService";

function TotpResetAnalytics() {
  // Initialize with proper types
  const [stats, setStats] = useState<TotpResetStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get token from Redux store
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchTotpResetAnalytics(token);

        if (response && response.result) {
          setStats(response.result);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching TOTP reset analytics:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load analytics data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">TOTP Reset Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Total Requests</div>
          <div className="text-2xl font-bold">{stats.totalRequests}</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 mb-1">Pending Requests</div>
          <div className="text-2xl font-bold">{stats.pendingRequests}</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Last 30 Days</div>
          <div className="text-2xl font-bold">{stats.requestsLastMonth}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Approved</div>
          <div className="text-2xl font-bold">{stats.approvedRequests}</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.totalRequests > 0
              ? `${(
                  (stats.approvedRequests / stats.totalRequests) *
                  100
                ).toFixed(1)}%`
              : "0%"}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600 mb-1">Rejected</div>
          <div className="text-2xl font-bold">{stats.rejectedRequests}</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.totalRequests > 0
              ? `${(
                  (stats.rejectedRequests / stats.totalRequests) *
                  100
                ).toFixed(1)}%`
              : "0%"}
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-sm text-purple-600 mb-1">
          Average Processing Time
        </div>
        <div className="text-2xl font-bold">
          {stats.averageProcessingTimeHours !== null
            ? `${stats.averageProcessingTimeHours.toFixed(1)} hours`
            : "N/A"}
        </div>
      </div>
    </div>
  );
}

export default TotpResetAnalytics;

