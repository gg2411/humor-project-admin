export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">
          You do not have superadmin privileges to access this area.
        </p>
        <p className="text-sm text-gray-600">
          If you believe this is an error, please contact a system administrator.
        </p>
      </div>
    </div>
  )
}
