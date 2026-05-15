export const STATUS_LABELS = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    UNDER_MAYOR_REVIEW: 'Under Mayor Review',
    APPROVED: 'Approved',
    SENT_TO_DEPARTMENT: 'Sent to Department',
    FILE_NUMBER_GENERATED: 'File No. Generated',
    IN_PROGRESS: 'In Progress',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
}

export const STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    UNDER_MAYOR_REVIEW: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-green-100 text-green-700',
    SENT_TO_DEPARTMENT: 'bg-purple-100 text-purple-700',
    FILE_NUMBER_GENERATED: 'bg-cyan-100 text-cyan-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    CLOSED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
}

export const STATUS_DOT = {
    DRAFT: 'bg-gray-400',
    SUBMITTED: 'bg-blue-500',
    UNDER_MAYOR_REVIEW: 'bg-orange-500',
    APPROVED: 'bg-green-500',
    SENT_TO_DEPARTMENT: 'bg-purple-500',
    FILE_NUMBER_GENERATED: 'bg-cyan-500',
    IN_PROGRESS: 'bg-indigo-500',
    CLOSED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
}

export const ALL_STATUSES = Object.keys(STATUS_LABELS)

export const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}