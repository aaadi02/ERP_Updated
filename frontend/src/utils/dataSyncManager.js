/**
 * Data Synchronization Utility
 * Ensures all modules in the system stay connected and synchronized
 */

class DataSyncManager {
  constructor() {
    this.syncQueue = [];
    this.listeners = {};
    this.isProcessing = false;
  }

  // Register a listener for data changes
  subscribe(module, callback) {
    if (!this.listeners[module]) {
      this.listeners[module] = [];
    }
    this.listeners[module].push(callback);
  }

  // Unsubscribe from data changes
  unsubscribe(module, callback) {
    if (this.listeners[module]) {
      this.listeners[module] = this.listeners[module].filter(cb => cb !== callback);
    }
  }

  // Trigger sync across modules
  async triggerSync(sourceModule, action, data) {
    console.log(`🔄 Data sync triggered: ${sourceModule} → ${action}`);
    
    // Add to sync queue
    this.syncQueue.push({
      sourceModule,
      action,
      data,
      timestamp: new Date()
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  // Process the sync queue
  async processQueue() {
    this.isProcessing = true;

    while (this.syncQueue.length > 0) {
      const syncItem = this.syncQueue.shift();
      await this.processSyncItem(syncItem);
    }

    this.isProcessing = false;
  }

  // Process individual sync item
  async processSyncItem({ sourceModule, action, data }) {
    try {
      switch (sourceModule) {
        case 'salary':
          await this.handleSalarySync(action, data);
          break;
        case 'pf':
          await this.handlePFSync(action, data);
          break;
        case 'student':
          await this.handleStudentSync(action, data);
          break;
        case 'payment':
          await this.handlePaymentSync(action, data);
          break;
        default:
          console.log(`ℹ️ No sync handler for module: ${sourceModule}`);
      }
    } catch (error) {
      console.error(`❌ Sync error for ${sourceModule}:`, error);
    }
  }

  // Handle salary-related syncs
  async handleSalarySync(action, data) {
    switch (action) {
      case 'create':
      case 'update':
        // Auto-generate/update PF record
        await this.syncSalaryToPF(data);
        // Notify listeners
        this.notifyListeners('pf', 'salary_updated', data);
        break;
      case 'delete':
        // Handle cascade delete
        await this.handleSalaryDelete(data);
        break;
    }
  }

  // Handle PF-related syncs
  async handlePFSync(action, data) {
    switch (action) {
      case 'create':
      case 'update':
        // Auto-sync to Income Tax
        await this.syncPFToIncomeTax(data);
        // Notify listeners
        this.notifyListeners('income_tax', 'pf_updated', data);
        break;
    }
  }

  // Handle student-related syncs
  async handleStudentSync(action, data) {
    switch (action) {
      case 'create':
        // Initialize fee structure
        await this.initializeStudentFees(data);
        break;
      case 'update':
        // Update related records
        this.notifyListeners('payments', 'student_updated', data);
        break;
    }
  }

  // Handle payment-related syncs
  async handlePaymentSync(action, data) {
    switch (action) {
      case 'create':
        // Update student fee status
        await this.updateStudentFeeStatus(data);
        // Update dashboard statistics
        this.notifyListeners('dashboard', 'payment_created', data);
        break;
    }
  }

  // Sync salary data to PF
  async syncSalaryToPF(salaryData) {
    try {
      const response = await fetch(`http://localhost:5000/api/faculty/employee/${salaryData.name}/auto-generate-pf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialYear: '2024-2025',
          ptState: 'Karnataka'
        })
      });

      if (response.ok) {
        console.log(`✅ PF record synced for ${salaryData.name}`);
      }
    } catch (error) {
      console.error('Error syncing salary to PF:', error);
    }
  }

  // Sync PF data to Income Tax
  async syncPFToIncomeTax(pfData) {
    try {
      // Check if income tax record exists
      const existingResponse = await fetch(`http://localhost:5000/api/income-tax?employeeName=${pfData.employeeName}`);
      const existing = await existingResponse.json();

      const updateData = {
        employerPF: pfData.employerPFContribution,
        professionalTax: pfData.professionalTax,
        ppf: pfData.employeePFContribution
      };

      if (existing.length > 0) {
        // Update existing record
        await fetch(`http://localhost:5000/api/income-tax/${existing[0]._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      } else {
        // Create new record
        await fetch('http://localhost:5000/api/income-tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: pfData.employeeId,
            employeeName: pfData.employeeName,
            panNumber: pfData.panNumber || '',
            financialYear: pfData.financialYear,
            ...updateData
          })
        });
      }

      console.log(`✅ Income Tax record synced for ${pfData.employeeName}`);
    } catch (error) {
      console.error('Error syncing PF to Income Tax:', error);
    }
  }

  // Initialize student fee structure
  async initializeStudentFees(studentData) {
    try {
      // Fetch applicable fee heads
      const response = await fetch(`http://localhost:5000/api/fee-heads/applicable/${studentData._id}`);
      const feeHeads = await response.json();
      
      console.log(`✅ Fee structure initialized for ${studentData.firstName} ${studentData.lastName}`);
      this.notifyListeners('fees', 'student_initialized', { student: studentData, feeHeads });
    } catch (error) {
      console.error('Error initializing student fees:', error);
    }
  }

  // Update student fee status after payment
  async updateStudentFeeStatus(paymentData) {
    try {
      if (paymentData.studentId) {
        this.notifyListeners('student', 'payment_received', paymentData);
        console.log(`✅ Student fee status updated for payment ${paymentData.receiptNumber}`);
      }
    } catch (error) {
      console.error('Error updating student fee status:', error);
    }
  }

  // Notify all listeners of a module
  notifyListeners(module, event, data) {
    if (this.listeners[module]) {
      this.listeners[module].forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.error(`Error in listener for ${module}:`, error);
        }
      });
    }
  }

  // Get system health status
  async getSystemHealth() {
    try {
      const endpoints = [
        'http://localhost:5000/api/students/stats/overview',
        'http://localhost:5000/api/faculty/status',
        'http://localhost:5000/api/students/fees/status'
      ];

      const results = await Promise.allSettled(
        endpoints.map(url => fetch(url).then(r => r.json()))
      );

      const healthScore = results.filter(r => r.status === 'fulfilled').length / results.length * 100;
      
      return {
        score: Math.round(healthScore),
        status: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : 'poor',
        details: results.map((r, i) => ({
          endpoint: endpoints[i],
          status: r.status,
          success: r.status === 'fulfilled'
        }))
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return { score: 0, status: 'error', details: [] };
    }
  }

  // Manual system-wide sync
  async performFullSync() {
    console.log('🔄 Performing full system sync...');
    
    try {
      // 1. Sync all salary records to PF
      const salaryResponse = await fetch('http://localhost:5000/api/salary');
      const salaryRecords = await salaryResponse.json();
      
      for (const salary of salaryRecords) {
        await this.syncSalaryToPF(salary);
      }

      // 2. Sync all PF records to Income Tax
      const pfResponse = await fetch('http://localhost:5000/api/pf');
      const pfRecords = await pfResponse.json();
      
      for (const pf of pfRecords) {
        await this.syncPFToIncomeTax(pf);
      }

      // 3. Refresh all module dashboards
      this.notifyListeners('dashboard', 'full_sync_complete', {});
      
      console.log('✅ Full system sync completed');
      return { success: true, message: 'Full sync completed successfully' };
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const dataSyncManager = new DataSyncManager();

// Export for use in components
export default dataSyncManager;

// Helper hook for React components
export function useDataSync(module) {
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const handleSync = (event, data) => {
      setLastSync({ event, data, timestamp: new Date() });
    };

    dataSyncManager.subscribe(module, handleSync);

    return () => {
      dataSyncManager.unsubscribe(module, handleSync);
    };
  }, [module]);

  const triggerSync = (action, data) => {
    return dataSyncManager.triggerSync(module, action, data);
  };

  return { lastSync, triggerSync };
}
