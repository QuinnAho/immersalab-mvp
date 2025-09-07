#!/bin/bash

# ImmersaLab MVP Progress Monitor Script

LOGS_DIR="./logs"
PROGRESS_LOG="$LOGS_DIR/progress.log"

show_help() {
    echo "🔍 ImmersaLab MVP Progress Monitor"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  -r, --realtime   Show real-time progress updates"
    echo "  -s, --summary    Show job summary statistics"
    echo "  -j, --jobs       List all jobs with status"
    echo "  -f, --failed     Show failed jobs only"
    echo "  -c, --completed  Show completed jobs only"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -r            # Monitor progress in real-time"
    echo "  $0 -s            # Show job statistics"
    echo "  $0 -j            # List all jobs"
    echo "  $0 -f            # Show only failed jobs"
}

show_realtime() {
    echo "📊 Real-time Job Progress Monitor"
    echo "================================"
    echo "Press Ctrl+C to exit"
    echo ""
    
    tail -f "$PROGRESS_LOG" 2>/dev/null | while read -r line; do
        if echo "$line" | grep -q "JOB_PROGRESS"; then
            # Parse the JSON progress data
            job_data=$(echo "$line" | grep -o 'JOB_PROGRESS: {.*}' | sed 's/JOB_PROGRESS: //')
            
            if [ -n "$job_data" ]; then
                # Extract key fields using basic text processing
                job_id=$(echo "$job_data" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
                stage=$(echo "$job_data" | grep -o '"stage":"[^"]*"' | cut -d'"' -f4)
                progress=$(echo "$job_data" | grep -o '"progress":[0-9-]*' | cut -d':' -f2)
                message=$(echo "$job_data" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                timestamp=$(echo "$job_data" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 | cut -c12-19)
                
                # Create progress bar
                if [ "$progress" -ge 0 ] && [ "$progress" -le 100 ]; then
                    bar_length=20
                    filled=$((progress * bar_length / 100))
                    bar=$(printf "%*s" $filled | tr ' ' '█')
                    empty=$(printf "%*s" $((bar_length - filled)) | tr ' ' '░')
                    progress_bar="[$bar$empty] $progress%"
                else
                    progress_bar="[FAILED]"
                fi
                
                printf "\r\033[K%s | %s | %-12s | %s | %s\n" \
                    "$timestamp" "$job_id" "$stage" "$progress_bar" "$message"
            fi
        fi
    done
}

show_summary() {
    echo "📈 Job Summary Statistics"
    echo "========================"
    
    if [ ! -f "$PROGRESS_LOG" ]; then
        echo "No progress logs found"
        return
    fi
    
    total_jobs=$(grep "JOB_PROGRESS.*started" "$PROGRESS_LOG" | wc -l)
    completed_jobs=$(grep "JOB_PROGRESS.*completed.*100" "$PROGRESS_LOG" | wc -l)
    failed_jobs=$(grep "JOB_PROGRESS.*failed" "$PROGRESS_LOG" | wc -l)
    processing_jobs=$((total_jobs - completed_jobs - failed_jobs))
    
    echo "Total Jobs: $total_jobs"
    echo "Completed: $completed_jobs"
    echo "Failed: $failed_jobs"
    echo "Processing: $processing_jobs"
    echo ""
    
    if [ "$total_jobs" -gt 0 ]; then
        success_rate=$((completed_jobs * 100 / total_jobs))
        echo "Success Rate: $success_rate%"
    fi
}

show_jobs() {
    echo "📋 All Jobs Status"
    echo "=================="
    
    if [ ! -f "$PROGRESS_LOG" ]; then
        echo "No progress logs found"
        return
    fi
    
    printf "%-36s | %-12s | %-8s | %s\n" "Job ID" "Stage" "Progress" "Last Update"
    echo "$(printf '%*s' 80 | tr ' ' '-')"
    
    # Get unique job IDs
    grep "JOB_PROGRESS" "$PROGRESS_LOG" | \
    grep -o '"jobId":"[^"]*"' | cut -d'"' -f4 | sort -u | while read -r job_id; do
        # Get the latest entry for this job
        latest=$(grep "JOB_PROGRESS.*$job_id" "$PROGRESS_LOG" | tail -1)
        
        if [ -n "$latest" ]; then
            stage=$(echo "$latest" | grep -o '"stage":"[^"]*"' | cut -d'"' -f4)
            progress=$(echo "$latest" | grep -o '"progress":[0-9-]*' | cut -d':' -f2)
            timestamp=$(echo "$latest" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 | cut -c12-19)
            
            if [ "$progress" -ge 0 ] && [ "$progress" -le 100 ]; then
                progress_str="$progress%"
            else
                progress_str="FAILED"
            fi
            
            printf "%-36s | %-12s | %-8s | %s\n" "$job_id" "$stage" "$progress_str" "$timestamp"
        fi
    done
}

show_failed() {
    echo "❌ Failed Jobs"
    echo "============="
    
    if [ ! -f "$PROGRESS_LOG" ]; then
        echo "No progress logs found"
        return
    fi
    
    grep "JOB_PROGRESS.*failed" "$PROGRESS_LOG" | while read -r line; do
        job_id=$(echo "$line" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        message=$(echo "$line" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        timestamp=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 | cut -c1-19)
        
        echo "[$timestamp] Job: $job_id"
        echo "  Error: $message"
        echo ""
    done
}

show_completed() {
    echo "✅ Completed Jobs"
    echo "================="
    
    if [ ! -f "$PROGRESS_LOG" ]; then
        echo "No progress logs found"
        return
    fi
    
    grep "JOB_PROGRESS.*completed.*100" "$PROGRESS_LOG" | while read -r line; do
        job_id=$(echo "$line" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        timestamp=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 | cut -c1-19)
        
        echo "[$timestamp] Job: $job_id - COMPLETED ✅"
    done
}

# Main script logic
case "${1:-}" in
    -r|--realtime)
        show_realtime
        ;;
    -s|--summary)
        show_summary
        ;;
    -j|--jobs)
        show_jobs
        ;;
    -f|--failed)
        show_failed
        ;;
    -c|--completed)
        show_completed
        ;;
    -h|--help)
        show_help
        ;;
    *)
        show_help
        ;;
esac