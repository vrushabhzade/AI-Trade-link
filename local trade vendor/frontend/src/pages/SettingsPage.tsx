import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    email: user?.email || '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = () => {
    updateUser({
      fullName: formData.fullName,
      preferredLanguage: formData.preferredLanguage,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      preferredLanguage: user?.preferredLanguage || 'en',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  const handleDeleteAccount = () => {
    // In a real app, this would call an API to delete the account
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and settings</p>
        </div>

        {/* Account Information */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{user.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <p className="text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Preferences</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Language
            </label>
            {isEditing ? (
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {formData.preferredLanguage === 'en' && 'English'}
                {formData.preferredLanguage === 'hi' && 'Hindi (हिन्दी)'}
                {formData.preferredLanguage === 'es' && 'Spanish (Español)'}
                {formData.preferredLanguage === 'fr' && 'French (Français)'}
                {formData.preferredLanguage === 'ar' && 'Arabic (العربية)'}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This language will be used for the interface and automatic translations
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email notifications for new messages</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email notifications for price changes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email notifications for negotiation updates</span>
            </label>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h2>
          <div className="space-y-3">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Change Password
            </button>
            <br />
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Download My Data
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-red-50">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-900">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
