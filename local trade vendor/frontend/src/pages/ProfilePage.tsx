import React from 'react'
import { useAuthStore } from '../stores/authStore'

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()

  if (!user) {
    return <div>Please log in to view your profile.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={user.fullName}
              className="input-field"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              className="input-field"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={user.role}
              className="input-field"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language
            </label>
            <select className="input-field" value={user.preferredLanguage}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          
          <button className="btn-primary">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage