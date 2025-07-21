import React from 'react';

function TestTicketCreation() {
  const createTestTicket = async () => {
    const testData = {
      title: "Frontend Debug Ticket",
      description: "Testing from React frontend",
      category: "Other",
      priority: "medium",
      location: {
        building: "Debug Building",
        room: "Debug Room"
      },
      reportedBy: {
        name: "Debug User",
        department: "Frontend Testing"
      },
      estimatedCost: 1000
    };

    try {
      console.log('Frontend: Sending request...');
      const response = await fetch('http://localhost:5000/api/maintenance/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      console.log('Frontend: Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Frontend: Success!', result);
        alert(`Success! Created ticket: ${result.ticket.ticketId}`);
      } else {
        const error = await response.json();
        console.error('Frontend: Error response:', error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Frontend: Network error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">MaintenancePro - Debug Ticket Creation</h3>
      <button 
        onClick={createTestTicket}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Create Ticket
      </button>
    </div>
  );
}

export default TestTicketCreation;
