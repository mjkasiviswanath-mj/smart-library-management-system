import { Book, SortField } from '../types/library';

/**
 * Manual Quick Sort implementation for Book objects.
 * Time Complexity: Average O(n log n), Worst O(n^2)
 * Space Complexity: O(log n)
 * 
 * Demonstrates manual partition & divide-and-conquer sorting.
 * Built-in Array.prototype.sort() is NOT used.
 */

// Helper to compare two book attributes
function compareBooks(a: Book, b: Book, field: SortField): number {
  if (field === 'year') {
    return a.year - b.year;
  }
  const valA = (a[field] || '').toString().toLowerCase();
  const valB = (b[field] || '').toString().toLowerCase();
  if (valA < valB) return -1;
  if (valA > valB) return 1;
  return 0;
}

// Partition helper function (Lomuto partition scheme)
function partition(arr: Book[], low: number, high: number, field: SortField): number {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    // If current element is smaller than or equal to pivot
    if (compareBooks(arr[j], pivot, field) <= 0) {
      i++;
      // Swap arr[i] and arr[j]
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }

  // Swap arr[i + 1] and arr[high] (pivot)
  const temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;

  return i + 1;
}

// Recursive QuickSort function
function quickSortHelper(arr: Book[], low: number, high: number, field: SortField): void {
  if (low < high) {
    // pi is partitioning index, arr[pi] is now at right place
    const pi = partition(arr, low, high, field);

    // Recursively sort elements before partition and after partition
    quickSortHelper(arr, low, pi - 1, field);
    quickSortHelper(arr, pi + 1, high, field);
  }
}

/**
 * Public QuickSort function.
 * Creates a shallow copy of the input array so the original remains intact,
 * then sorts it in place using the manual Lomuto Quick Sort algorithm.
 */
export function manualQuickSort(books: Book[], field: SortField = 'title'): Book[] {
  if (!books || books.length <= 1) return [...books];
  const copy = [...books];
  quickSortHelper(copy, 0, copy.length - 1, field);
  return copy;
}
