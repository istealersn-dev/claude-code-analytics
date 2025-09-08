import React from 'react';
import { Card } from '../ui/card';

interface BudgetData {
  currentMonthSpend: number;
  projectedMonthSpend: number;
  budgetLimit: number;
  budgetUtilization: number;
  daysRemaining: number;
}

interface BudgetTrackingCardProps {
  budgetData: BudgetData;
}

export function BudgetTrackingCard({ budgetData }: BudgetTrackingCardProps) {
  const utilizationPercentage = Math.min(budgetData.budgetUtilization, 100);
  const isOverBudget = budgetData.budgetUtilization > 100;
  // Use configurable threshold based on budget limit
  const BUDGET_WARNING_THRESHOLD = 80;
  const isNearBudget = budgetData.budgetUtilization > BUDGET_WARNING_THRESHOLD;

  const getUtilizationColor = () => {
    if (isOverBudget) return 'from-red-600 to-red-400';
    if (isNearBudget) return 'from-yellow-600 to-yellow-400';
    return 'from-green-600 to-green-400';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return '🚨';
    if (isNearBudget) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (isOverBudget) return 'Over Budget';
    if (isNearBudget) return 'Near Budget Limit';
    return 'On Track';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Budget Tracking</h3>
        <span className="text-2xl">{getStatusIcon()}</span>
      </div>

      <div className="space-y-6">
        {/* Current vs Projected */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Current Spend</div>
            <div className="text-2xl font-bold text-white">
              ${budgetData.currentMonthSpend.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Budget Limit</div>
            <div className="text-2xl font-bold text-white">
              ${budgetData.budgetLimit.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Projected Spend</div>
            <div className="text-2xl font-bold text-white">
              ${budgetData.projectedMonthSpend.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Days Remaining</div>
            <div className="text-2xl font-bold text-white">
              {budgetData.daysRemaining}
            </div>
          </div>
        </div>

        {/* Budget Utilization Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Budget Utilization</span>
            <span className={`text-sm font-medium ${
              isOverBudget ? 'text-red-400' : isNearBudget ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {budgetData.budgetUtilization.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${getUtilizationColor()} transition-all duration-500`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          
          {isOverBudget && (
            <div className="mt-1 text-xs text-red-400">
              Over budget by ${(budgetData.currentMonthSpend - budgetData.budgetLimit).toFixed(2)}
            </div>
          )}
        </div>

        {/* Status and Recommendations */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">{getStatusText()}</div>
              <div className="text-xs text-gray-400 mt-1">
                {isOverBudget 
                  ? 'Consider reducing usage to control costs'
                  : isNearBudget 
                  ? 'Monitor usage closely for remaining days'
                  : 'Spending is within expected range'
                }
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-400">Daily Avg</div>
              <div className="text-sm font-medium text-white">
                ${(budgetData.currentMonthSpend / (30 - budgetData.daysRemaining || 1)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}