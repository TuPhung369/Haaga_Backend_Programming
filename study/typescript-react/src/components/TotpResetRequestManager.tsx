import React, { useState, useEffect } from "react";

// Define the types for TOTP reset request
interface TotpResetRequest {
  id: string;
  username: string;
  email: string;
  requestTime: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  processed: boolean;
  processedBy?: string;
  processedTime?: string;
  notes?: string;
}

// Define notification type
interface Notification {
  type: "success" | "error";
  message: string;
}

// Define API response type
interface ApiResponse {
  result: TotpResetRequest[];
  message?: string;
}

function TotpResetRequestManager() {
  // Apply proper types to state variables
  const [requests, setRequests] = useState<TotpResetRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [selectedRequest, setSelectedRequest] =
    useState<TotpResetRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Fetch TOTP reset requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const isPending = activeTab === "pending";
      const response = await fetch(
        `/auth/totp/admin/reset-requests?pending=${isPending}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching requests: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setRequests(data.result || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch TOTP reset requests:", err);
      setError("Failed to load TOTP reset requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load requests when component mounts or tab changes
  useEffect(() => {
    fetchRequests();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle opening the action dialog
  const handleActionClick = (
    request: TotpResetRequest,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes(
      action === "approve"
        ? "Approved after identity verification"
        : "Request rejected"
    );
    setDialogOpen(true);
  };

  // Handle submitting the action
  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setActionLoading(true);
      const endpoint = `/auth/totp/admin/reset-requests/${selectedRequest.id}/${actionType}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${actionType} request: ${response.statusText}`
        );
      }

      // Show success notification
      setNotification({
        type: "success",
        message: `Request has been ${
          actionType === "approve" ? "approved" : "rejected"
        } successfully`,
      });

      // Refresh the list
      fetchRequests();
      setDialogOpen(false);
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setNotification({
        type: "error",
        message: `Failed to ${actionType} request: ${errorMessage}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Format date to relative time
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);

      if (diffSec < 60) return `${diffSec} seconds ago`;
      if (diffMin < 60) return `${diffMin} minutes ago`;
      if (diffHour < 24) return `${diffHour} hours ago`;
      return `${diffDay} days ago`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          TOTP Reset Request Management
        </h2>
        <p className="text-gray-600">
          Approve or reject user requests to reset their two-factor
          authentication
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 mb-4 rounded ${
            notification.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-4 ${
                activeTab === "pending"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`py-2 px-4 ${
                activeTab === "all"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Requests
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading && requests.length === 0 ? (
          <div className="text-center py-8">
            <p>Loading requests...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-600">
              No {activeTab === "pending" ? "pending " : ""}TOTP reset requests
              found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {activeTab === "all" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </>
                  )}
                  {activeTab === "pending" && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {request.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(request.requestTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    {activeTab === "all" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.processedBy || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.notes || "—"}
                        </td>
                      </>
                    )}
                    {activeTab === "pending" &&
                      request.status === "PENDING" && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() =>
                              handleActionClick(request, "approve")
                            }
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-md mr-2 hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick(request, "reject")}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {requests.length} request{requests.length !== 1 ? "s" : ""} found
        </span>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Action confirmation dialog */}
      {dialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">
              {actionType === "approve"
                ? "Approve TOTP Reset"
                : "Reject TOTP Reset"}
            </h3>
            <p className="text-gray-600 mb-4">
              {actionType === "approve"
                ? "This will reset the user's TOTP setup and allow them to configure a new device."
                : "This will reject the user's request for TOTP reset."}
            </p>

            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Username</div>
                  <div className="font-medium">{selectedRequest.username}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{selectedRequest.email}</div>
                </div>
              </div>

              <div className="mb-2 text-sm text-gray-500">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                className="w-full border rounded-md p-2"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDialogOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded text-white ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {actionLoading
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Approve"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TotpResetRequestManager;

