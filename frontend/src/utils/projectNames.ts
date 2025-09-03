/**
 * Utility functions for cleaning up project names for better display
 */

export function cleanProjectName(projectName: string): string {
  if (!projectName) return 'Unknown';
  
  // Remove the long path prefix and get just the project folder name
  const pathParts = projectName.split('-');
  
  // Find the last meaningful part of the path (usually the actual project name)
  // Skip common path parts like 'Users', 'Documents', 'Side-Projects', etc.
  const meaningfulParts = pathParts.filter(part => 
    part && 
    !['Users', 'stanleynadar', 'Documents', 'Side', 'Projects', 'Experiments'].includes(part)
  );
  
  if (meaningfulParts.length === 0) {
    // Fallback to the last part of the original path
    return pathParts[pathParts.length - 1] || 'Unknown';
  }
  
  // Join the meaningful parts back together
  const cleanName = meaningfulParts.join('-');
  
  // Further clean up common patterns
  return cleanName
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
    .join(' ')
    .replace(/\b(And|Or|The|A|An)\b/g, word => word.toLowerCase()) // Fix common articles
    .trim();
}

export function truncateProjectName(projectName: string, maxLength: number = 25): string {
  const cleaned = cleanProjectName(projectName);
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Try to truncate at word boundaries
  const words = cleaned.split(' ');
  let result = '';
  
  for (const word of words) {
    if ((result + ' ' + word).length > maxLength - 3) {
      break;
    }
    result += (result ? ' ' : '') + word;
  }
  
  return result + (result.length < cleaned.length ? '...' : '');
}

export function getProjectDisplayName(projectName: string, context: 'legend' | 'tooltip' | 'full' = 'legend'): string {
  switch (context) {
    case 'legend':
      return truncateProjectName(projectName, 20);
    case 'tooltip':
      return truncateProjectName(projectName, 40);
    case 'full':
      return cleanProjectName(projectName);
    default:
      return truncateProjectName(projectName);
  }
}