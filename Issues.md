# Claude Code Analytics - Known Issues

## Current Data Issues (Identified: September 1, 2025)

### 🔧 Priority: High - Mixed Real/Mock Data in Dashboard

**Status**: Identified but not yet resolved  
**Impact**: Frontend displays inconsistent data experience  
**Next Session Priority**: High  

#### Problem Description
After successfully syncing 42 Claude Code sessions to the database, the dashboard shows a mixture of real and mock data:

#### ✅ Working with Real Data
- **Session Counts**: 42 total sessions correctly displayed
- **Project Distribution**: Real project breakdown from actual usage
- **Session Timing**: Actual daily activity patterns (Aug 4 - Sep 1, 2025)
- **Model Usage**: claude-3-sonnet-20240229 showing 100% usage
- **Date Ranges**: Real session date patterns in time-series charts

#### ❌ Issues with Real Data
1. **Cost Analysis**: All values show $0.00
   - Daily/weekly/monthly costs all zero
   - Cost by model shows zero
   - Most expensive sessions show zero cost
   - **Root Cause**: Cost calculation depends on token counts and pricing models

2. **Token Metrics**: All token counts show 0
   - Total input tokens: 0
   - Total output tokens: 0
   - Token efficiency calculations affected
   - **Root Cause**: Token data not being parsed or stored correctly from JSONL

3. **Tools Usage**: Empty arrays everywhere
   - Top tools shows empty
   - Tools breakdown missing
   - **Root Cause**: Tools array parsing issue in data sync process

4. **Phase 3.2/3.3 Charts Still Using Mock Data**
   - Distribution charts (pie/bar): Using hardcoded mock data
   - Heatmap visualization: Using generated mock patterns
   - Performance metrics: Using mock session statistics
   - **Root Cause**: New APIs implemented with mock data for testing

#### Technical Details
- **Database**: 42 sessions, 9,111 messages successfully inserted
- **Sync Process**: Completed without errors (352ms duration)
- **API Endpoints**: Original endpoints pulling real data, new endpoints using mock data

### 🔍 Diagnostic Next Steps
1. **Investigate Token Parsing**: Check JSONL structure vs expected token fields
2. **Fix Cost Calculation**: Implement proper token-based cost calculation with model pricing
3. **Debug Tools Array**: Review tools_used field parsing in data sync
4. **Replace Mock Data**: Convert Phase 3.2/3.3 APIs to use real database queries
5. **Data Validation**: Add logging to see what fields are missing during sync

### 🚀 Implementation Plan for Next Session
1. **Phase 1**: Fix core data parsing (tokens, tools, costs)
2. **Phase 2**: Replace mock data in distribution/heatmap/performance APIs
3. **Phase 3**: Verify all charts show consistent real data
4. **Phase 4**: Add data validation and error reporting

### 📋 Related Files to Review
- `src/data/jsonl-parser.ts` - JSONL parsing logic
- `src/database/query-builder.ts` - Mock data in new methods
- `src/server/routes/analytics.ts` - API endpoints
- Sample JSONL files to understand data structure

---

## Other Issues

### 🔧 Minor - Sync API Error Handling
**Status**: Identified  
**Impact**: Low - affects ease of use  

The `/api/sync/run` endpoint requires a JSON body with parameters, but returns unclear error when called without body. Should default to sensible parameters for simple POST requests.

---

*Last Updated: September 1, 2025*  
*Next Review: During data parsing investigation*