import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationUI() {
  return (
    <div className="p-4 max-w-full font-sans">
      <h1 className="text-2xl font-bold mb-6">Send Notification</h1>
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Compose Notification Panel */}
        <div className="bg-white rounded-lg shadow p-6 flex-1">
          <h2 className="text-xl font-bold mb-4">Compose Notification</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Recipient</label>
            <div className="relative">
              <select className="w-full p-2 border border-gray-300 rounded bg-white appearance-none pr-8">
                <option>Select recipient</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Notification Title</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="Enter notification title"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded resize-none h-32" 
              placeholder="Enter your notification message"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50">
              Save Draft
            </button>
            <button className="px-4 py-2 bg-gray-900 text-white rounded flex items-center gap-2 hover:bg-gray-800">
              <Bell size={16} />
              Send Notification
            </button>
          </div>
        </div>
        
        {/* Recent Notifications Panel */}
        <div className="bg-white rounded-lg shadow p-6 lg:w-96">
          <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
          
          <div className="space-y-4">
            {/* Notification 1 */}
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">Assignment Deadline Extended</h3>
              <p className="text-sm text-gray-600">Sent to: Data Structures - CS302</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            
            {/* Notification 2 */}
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">Quiz Reminder</h3>
              <p className="text-sm text-gray-600">Sent to: All Students</p>
              <p className="text-sm text-gray-500">Yesterday</p>
            </div>
            
            {/* Notification 3 */}
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">Class Postponed</h3>
              <p className="text-sm text-gray-600">Sent to: Database Management - CS304</p>
              <p className="text-sm text-gray-500">3 days ago</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}