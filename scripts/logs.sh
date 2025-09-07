#!/bin/bash

# ImmersaLab MVP Log Viewer Script

LOGS_DIR="./logs"

show_help() {
    echo "📊 ImmersaLab MVP Log Viewer"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  -a, --all        Show all logs (default)"
    echo "  -e, --errors     Show error logs only"
    echo "  -p, --progress   Show job progress logs"
    echo "  -s, --service    Show service-specific logs (api, worker, web)"
    echo "  -j, --job ID     Show logs for specific job ID"
    echo "  -f, --follow     Follow logs in real-time"
    echo "  -t, --tail N     Show last N lines (default: 100)"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -f             # Follow all logs in real-time"
    echo "  $0 -p -f          # Follow progress logs"
    echo "  $0 -s api         # Show API service logs"
    echo "  $0 -j abc123      # Show logs for job abc123"
    echo "  $0 -e -t 50       # Show last 50 error log entries"
}

# Default values
FOLLOW=false
TAIL_LINES=100
SHOW_ERRORS=false
SHOW_PROGRESS=false
SERVICE=""
JOB_ID=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            # Default behavior, no action needed
            shift
            ;;
        -e|--errors)
            SHOW_ERRORS=true
            shift
            ;;
        -p|--progress)
            SHOW_PROGRESS=true
            shift
            ;;
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -j|--job)
            JOB_ID="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -t|--tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

echo "📊 ImmersaLab MVP Logs"
echo "====================="

if [ "$SHOW_ERRORS" = true ]; then
    echo "🔴 Showing error logs..."
    if [ "$FOLLOW" = true ]; then
        tail -f "$LOGS_DIR/errors.log" 2>/dev/null || echo "No error logs found"
    else
        tail -n "$TAIL_LINES" "$LOGS_DIR/errors.log" 2>/dev/null || echo "No error logs found"
    fi
elif [ "$SHOW_PROGRESS" = true ]; then
    echo "⏳ Showing progress logs..."
    if [ "$FOLLOW" = true ]; then
        tail -f "$LOGS_DIR/progress.log" 2>/dev/null | grep "JOB_PROGRESS" || echo "No progress logs found"
    else
        tail -n "$TAIL_LINES" "$LOGS_DIR/progress.log" 2>/dev/null | grep "JOB_PROGRESS" || echo "No progress logs found"
    fi
elif [ -n "$SERVICE" ]; then
    echo "🔧 Showing $SERVICE service logs..."
    if [ "$FOLLOW" = true ]; then
        tail -f "$LOGS_DIR/$SERVICE.log" 2>/dev/null || echo "No $SERVICE logs found"
    else
        tail -n "$TAIL_LINES" "$LOGS_DIR/$SERVICE.log" 2>/dev/null || echo "No $SERVICE logs found"
    fi
elif [ -n "$JOB_ID" ]; then
    echo "🎯 Showing logs for job: $JOB_ID"
    if [ "$FOLLOW" = true ]; then
        tail -f "$LOGS_DIR"/*.log 2>/dev/null | grep "$JOB_ID" || echo "No logs found for job $JOB_ID"
    else
        grep "$JOB_ID" "$LOGS_DIR"/*.log 2>/dev/null | tail -n "$TAIL_LINES" || echo "No logs found for job $JOB_ID"
    fi
else
    echo "📋 Showing all logs..."
    if [ "$FOLLOW" = true ]; then
        tail -f "$LOGS_DIR"/*.log 2>/dev/null || echo "No logs found"
    else
        tail -n "$TAIL_LINES" "$LOGS_DIR/development.log" 2>/dev/null || echo "No development logs found"
    fi
fi