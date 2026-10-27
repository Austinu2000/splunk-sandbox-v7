export interface InstalledInput { type:string; token:string; label:string; default:string; choices:{value:string;label:string}[] }
export interface InstalledPanel { row:number; kind:string; title:string; query:string; base:string; text:string; options:Record<string,string> }
export interface InstalledView { app:string; id:string; label:string; description:string; kind:string; inputs:InstalledInput[]; panels:InstalledPanel[]; sourceSha256:string }
export const installedViews: InstalledView[] = [
  {
    "app": "launcher",
    "id": "home",
    "label": "Home",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "454fbd428d48b046c522973e08a568e077c89814bf2662f7c5599f0d311de7be"
  },
  {
    "app": "python_upgrade_readiness_app",
    "id": "jquery_scan",
    "label": "jQuery Scan",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "8a137024fd288c6c731010f25b7fa6346ad2801dcea4029dc9890d8a92b35e81"
  },
  {
    "app": "python_upgrade_readiness_app",
    "id": "python_scan",
    "label": "Python Scan",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "60c8d1d02aa625d3a48412df478852538643dbb294a64874cd14fdf0c15c0c25"
  },
  {
    "app": "python_upgrade_readiness_app",
    "id": "setting",
    "label": "Python Version",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "8b0352099eb33578f47e6454620b271846dc93fc6d6f905837c92270703e69ad"
  },
  {
    "app": "python_upgrade_readiness_app",
    "id": "setting_scan",
    "label": "Setting Scan",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3e6034358822f00ed4cd4c7472edcc4d7485f0a582d39f7ba9e4ac9e6ed06654"
  },
  {
    "app": "python_upgrade_readiness_app",
    "id": "splunk9x_scan",
    "label": "Splunk Platform Compatibility Scan",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "8173bf499fd4128903ea91f147d6fc0ceaa2d7ff1abefd4e476b717df6c63a90"
  },
  {
    "app": "search",
    "id": "alert",
    "label": "Alert",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a642206f1ffa8cfa4c57fa7592d2337b7dc45bf9fcd6f16b677b6209c394fb5b"
  },
  {
    "app": "search",
    "id": "alerts",
    "label": "Alerts",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20a964dd15c0ad5d9fdcc8e9ef59641d994dcffcbb8227441364b817941e0d88"
  },
  {
    "app": "search",
    "id": "charting",
    "label": "Advanced Charting",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "84e2a6435c2f676a0c9ca2e6c66d63b1e83ad8a79a509912aba12f9445bac0e1"
  },
  {
    "app": "search",
    "id": "dashboard_live",
    "label": "Summary",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "e73848400ddde1383cf28e9fe11987d68aeb02a9b11119ee19ecb53e048ae4be"
  },
  {
    "app": "search",
    "id": "dashboards",
    "label": "Dashboards",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "76af1d8adf98be3448cc1643208d62adf6c41ad6d6385aab946e19a926409020"
  },
  {
    "app": "search",
    "id": "data_model_editor",
    "label": "Data Model Editor",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "264c778bfd0ba7324ea23843110d364f2f6d5baf10bbc11edb4ca302da9dc8f3"
  },
  {
    "app": "search",
    "id": "data_model_explorer",
    "label": "Datasets",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "37218e8b0080992c0e388b4c6a3305d77c054d25821fcb004bf1a7232273e354"
  },
  {
    "app": "search",
    "id": "data_model_manager",
    "label": "Data Model Manager",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "d16d0fdc6e487de167d6de11436e604838f5befaa166a0154cf40988f7d5a0c4"
  },
  {
    "app": "search",
    "id": "data_models",
    "label": "Datasets",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "37218e8b0080992c0e388b4c6a3305d77c054d25821fcb004bf1a7232273e354"
  },
  {
    "app": "search",
    "id": "dataset",
    "label": "Dataset",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "5d7dead32c7c3d38c46b324f76763877f74b95a5f10f1af56ce510e43db53a97"
  },
  {
    "app": "search",
    "id": "datasets",
    "label": "Datasets",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "33a892d6afa43c110e2907edd98dc12f6866b759439910ae58469213fc4fa9fe"
  },
  {
    "app": "search",
    "id": "field_extractor",
    "label": "Field Extractor",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "295b8f91666521ab59d99c1cb6d072c191ce38d7de87cb271c57aa7a11b74436"
  },
  {
    "app": "search",
    "id": "flashtimeline",
    "label": "Search",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "b0aa00f29c4fb6a6d06e6aeb8cf4e93117814f9db427dc6b19bcd28e6bdf15e7"
  },
  {
    "app": "search",
    "id": "integrity_check_of_installed_files",
    "label": "Integrity Check of Installed Files",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "The file integrity check can identify when Splunk software files have been modified in a way that is not valid. This view queries the file integrity check endpoint for the selected instance (by default, the local instance). It reports on the status of this feature (is it enabled, disabled, or unavailable) and shows the results of the latest file integrity check if those are available.\n        Learn more.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Status of file integrity check",
        "query": "| rest splunk_server=$splunk_server$ /services/server/info\n| fields splunk_server version\n| join type=outer splunk_server [rest splunk_server=$splunk_server$ /services/server/status/installed-file-integrity\n    | fields splunk_server check_ready check_failures.fail]\n| eval check_status = case(isnull('check_failures.fail') AND isnotnull(check_ready), \"enabled\", 'check_failures.fail' == \"check_disabled\", \"disabled\", isnull(check_ready), \"feature unavailable\")\n| eval check_ready = if(check_status == \"enabled\", check_ready, \"N/A\")\n| fields version check_status check_ready\n| rename version AS \"Splunk version\" check_status AS \"Check status\" check_ready AS \"Results ready?\"",
        "base": "",
        "text": "",
        "options": {
          "count": "100",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Status of file integrity check",
        "query": "",
        "base": "",
        "text": "NOTE: Results for this check are available only from instances running version 6.5 or later of Splunk Enterprise or Splunk Light.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "List of installed files presenting integrity check failures",
        "query": "",
        "base": "",
        "text": "The table below shows files that were installed by the Splunk Enterprise package and have been improperly modified or are missing. Learn more.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "List of installed files presenting integrity check failures",
        "query": "| rest splunk_server=$splunk_server$ /services/server/status/installed-file-integrity\n| fields check_failures.*\n| untable splunk_server file_path check_result\n| replace \"check_failures.*\" WITH \"*\" IN file_path\n| fields file_path check_result\n| rename file_path AS \"File path\" check_result AS \"Check result\"",
        "base": "",
        "text": "",
        "options": {
          "count": "100",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      }
    ],
    "sourceSha256": "10fb8f5944d68aab5a1a432f464963b4b1d7a881bbe63bd17d08e0e808177234"
  },
  {
    "app": "search",
    "id": "job_details_dashboard",
    "label": "Job Details Dashboard",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This dashboard displays properties of a search job. Use it to gain insight into search job performance and troubleshoot search efficiency issues. Provide a Search ID for a job that has not expired.\n                Learn more.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Summary",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Search Duration",
        "query": "",
        "base": "",
        "text": "#search_duration .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                    #search_duration .single-value .single-result-unit {\n                    font-size: 30%;\n                    }",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Search Duration",
        "query": "fields runDuration",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0.00",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "unit": "s"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Total Events Scanned",
        "query": "",
        "base": "",
        "text": "#events_scanned .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Total Events Scanned",
        "query": "fields scanCount",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Total Events Matched",
        "query": "",
        "base": "",
        "text": "#events_matched .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Total Events Matched",
        "query": "fields eventCount",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Result Count",
        "query": "",
        "base": "",
        "text": "#result_count .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Result Count",
        "query": "fields resultCount",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Events Scanned Per Second",
        "query": "",
        "base": "",
        "text": "#events_scanned_per_sec .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events Scanned Per Second",
        "query": "eval eventsScannedPerSec=scanCount / exact(runDuration) | fields eventsScannedPerSec",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Search Status",
        "query": "",
        "base": "",
        "text": "#search_status .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Search Status",
        "query": "fields dispatchState | eval dispatchState=lower(dispatchState)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Search User",
        "query": "",
        "base": "",
        "text": "#search_user .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Search User",
        "query": "fields author",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Search Mode",
        "query": "",
        "base": "",
        "text": "#search_mode .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                \n                Learn more",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Search Mode",
        "query": "eval searchMode=if (isnull('custom.display.page.search.mode'), \"smart\", 'custom.display.page.search.mode') | fields searchMode",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Server Info",
        "query": "",
        "base": "",
        "text": "#server_info .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 5,
        "kind": "single",
        "title": "Server Info",
        "query": "fields splunk_server",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Search Strings",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Search String",
        "query": "fields search",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Optimized Search String",
        "query": "fields optimizedSearch",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Map Phase Search String",
        "query": "fields remoteSearch",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 10,
        "kind": "table",
        "title": "Reduce Phase Search String",
        "query": "fields reduceSearch | eval reduceSearch=if (isnull(reduceSearch), \"N/A\", reduceSearch)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Search Costs",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Search Costs by Command",
        "query": "index=\"_introspection\" sourcetype=search_telemetry search_id=*$sid$* | spath path=search_commands{}.name output=command | spath path=search_commands{}.duration output=duration | eval fields=mvzip(command, duration, \",\") | mvexpand fields | rex field=fields \"(?<Command>[^,]+),(?<Duration>.+)$\"\n                        | table Command, Duration",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleX.text": "Command",
          "charting.axisTitleY.text": "Duration (s)",
          "charting.chart": "bar",
          "charting.chart.showDataLabels": "all",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "Approximate Time Spent in Map Phase",
        "query": "",
        "base": "",
        "text": "#map_phase_time .dashboard-element-title {\n                    font-weight: normal !important;\n                    font-size: 90% !important;\n                    }\n                    #map_phase_time .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                    #map_phase_time .single-value .single-result-unit {\n                    font-size: 30%;\n                    }",
        "options": {}
      },
      {
        "row": 13,
        "kind": "single",
        "title": "Approximate Time Spent in Map Phase",
        "query": "fields performance*dispatch.stream.remote.*.duration_secs, performance*dispatch.stream.local.duration_secs | transpose | rename column as Indexer \"row 1\" as Duration | stats max(Duration)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "all",
          "numberPrecision": "0.00",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "unit": "s"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "Approximate Time Spent in Reduce Phase",
        "query": "",
        "base": "",
        "text": "#reduce_phase_time .dashboard-element-title {\n                    font-weight: normal !important;\n                    font-size: 90% !important;\n                    }\n                    #reduce_phase_time .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                    #reduce_phase_time .single-value .single-result-unit {\n                    font-size: 30%;\n                    }",
        "options": {}
      },
      {
        "row": 13,
        "kind": "single",
        "title": "Approximate Time Spent in Reduce Phase",
        "query": "fields reduceSearch | rex field=reduceSearch max_match=0 \"(^(?<first>\\w+){1})|((\\| (?<command>\\w+)))\" | eval Command = mvappend(first, command) | mvexpand Command | fields Command | eval Command=if(like(Command, \"%stats%\"), \"stats\", Command) | eval Command=if(like(Command, \"%bin%\"), \"prebin\", Command) | join Command [| search index=\"_introspection\" sourcetype=search_telemetry search_id=*$sid$* | spath path=search_commands{}.name output=command | spath path=search_commands{}.duration output=duration | eval tempField= mvzip(command, duration) | stats count by tempField | eval Command = mvindex(split(tempField,\",\"),0), Duration= mvindex(split(tempField,\",\"),1) | fields Command, Duration] | stats sum(Duration)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "all",
          "numberPrecision": "0.00",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "unit": "s"
        }
      },
      {
        "row": 14,
        "kind": "chart",
        "title": "Map Phase Search Costs by Command",
        "query": "fields remoteSearch | rex field=remoteSearch max_match=0 \"(^(?<first>\\w+){1})|((\\| (?<command>\\w+)))\" | eval Command = mvappend(first, command) | mvexpand Command | fields Command | join Command [| search index=\"_introspection\" sourcetype=search_telemetry search_id=*$sid$* | spath path=search_commands{}.name output=command | spath path=search_commands{}.duration output=duration | eval tempField= mvzip(command, duration) | stats count by tempField | eval Command = mvindex(split(tempField,\",\"),0), Duration= mvindex(split(tempField,\",\"),1) | fields Command, Duration] | table Command, Duration",
        "base": "baseSearch",
        "text": "",
        "options": {
          "charting.axisTitleX.text": "Command",
          "charting.axisTitleY.text": "Duration (s)",
          "charting.axisY.abbreviation": "none",
          "charting.axisY.scale": "linear",
          "charting.chart": "bar",
          "charting.chart.showDataLabels": "all",
          "charting.chart.stackMode": "default",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 15,
        "kind": "chart",
        "title": "Reduce Phase Search Costs by Command",
        "query": "fields reduceSearch | rex field=reduceSearch max_match=0 \"(^(?<first>\\w+){1})|((\\| (?<command>\\w+)))\" | eval Command = mvappend(first, command) | mvexpand Command | fields Command | eval Command=if(like(Command, \"%stats%\"), \"stats\", Command) | eval Command=if(like(Command, \"%bin%\"), \"prebin\", Command) | join Command [| search index=\"_introspection\" sourcetype=search_telemetry source=*$sid$* | spath path=search_commands{}.name output=command | spath path=search_commands{}.duration output=duration | eval tempField= mvzip(command, duration) | stats count by tempField | eval Command = mvindex(split(tempField,\",\"),0), Duration= mvindex(split(tempField,\",\"),1) | fields Command, Duration] | table Command, Duration",
        "base": "baseSearch",
        "text": "",
        "options": {
          "charting.axisTitleX.text": "Command",
          "charting.axisTitleY.text": "Duration (s)",
          "charting.chart": "bar",
          "charting.chart.showDataLabels": "all",
          "charting.drilldown": "all",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 16,
        "kind": "html",
        "title": "Startup Handoff Time",
        "query": "",
        "base": "",
        "text": "#startup_handoff .dashboard-element-title {\n                    font-weight: normal !important;\n                    font-size: 90% !important;\n                    }\n                    #startup_handoff .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                    #startup_handoff .single-value .single-result-unit {\n                    font-size: 30%;\n                    }",
        "options": {}
      },
      {
        "row": 16,
        "kind": "single",
        "title": "Startup Handoff Time",
        "query": "fields performance.startup.handoff.duration_secs",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0.00",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "unit": "s"
        }
      },
      {
        "row": 17,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Indexers",
        "options": {}
      },
      {
        "row": 18,
        "kind": "html",
        "title": "Number of Indexers",
        "query": "",
        "base": "",
        "text": "#num_of_indexers .single-value .single-result {\n                    font-size: 50px !important;\n                    }",
        "options": {}
      },
      {
        "row": 18,
        "kind": "single",
        "title": "Number of Indexers",
        "query": "fields performance*dispatch.stream.remote.*.duration_secs | transpose | rename column as Indexer \"row 1\" as Duration | stats count(Indexer)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 18,
        "kind": "html",
        "title": "Average Indexer Time",
        "query": "",
        "base": "",
        "text": "#avg_indexer_time .single-value .single-result {\n                    font-size: 50px !important;\n                    }\n                    #avg_indexer_time .single-value .single-result-unit {\n                    font-size: 30%;\n                    }",
        "options": {}
      },
      {
        "row": 18,
        "kind": "single",
        "title": "Average Indexer Time",
        "query": "fields performance*dispatch.stream.remote.*.duration_secs | transpose | rename column as Indexer \"row 1\" as Duration | stats avg(Duration)",
        "base": "baseSearch",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0.00",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "unit": "s"
        }
      },
      {
        "row": 19,
        "kind": "html",
        "title": "Time Spent Running Search Per Indexer",
        "query": "",
        "base": "",
        "text": "#time_per_indexer .dashboard-element-title {\n                    font-weight: normal !important;\n                    font-size: 90% !important;\n                    }",
        "options": {}
      },
      {
        "row": 19,
        "kind": "table",
        "title": "Time Spent Running Search Per Indexer",
        "query": "fields performance*dispatch.stream.remote.*.duration_secs | transpose | rename column as Indexer \"row 1\" as \"Duration (seconds)\" | rex field=Indexer \"performance*dispatch.stream.remote.(?<Indexer>.*).duration_secs\"",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "heatmap",
          "drilldown": "cell",
          "refresh.display": "progressbar",
          "rowNumbers": "true"
        }
      },
      {
        "row": 19,
        "kind": "table",
        "title": "Drilldown Details For Indexer $indexer$",
        "query": "fields performance*dispatch.stream.remote.$indexer$.* | transpose | rename column as Field \"row 1\" as Value | rex field=Field \"performance*dispatch.stream.remote.$indexer$.(?<Field>.*)$\"",
        "base": "baseSearch",
        "text": "",
        "options": {
          "count": "10",
          "drilldown": "row",
          "refresh.display": "progressbar"
        }
      }
    ],
    "sourceSha256": "2cdc36ed6526f34a8fcf730d85562a131ad3edc1d47a58220983aaf16a477d5c"
  },
  {
    "app": "search",
    "id": "job_manager",
    "label": "Job Manager",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4af7b5ecf5555b2565c965a536a091f2ad4eed045ff23baa7ee0ee0a9066ee1a"
  },
  {
    "app": "search",
    "id": "jquery_upgrade",
    "label": "jQuery Upgrade",
    "description": "The following list of dashboards might be affected by a security update that requires jQuery 3.5 or higher. Version 1.0 Simple XML dashboards use jQuery 2.1 and need to be upgraded to jQuery 3.5 by using version 1.1 of Simple XML dashboards. HTML dashboards also depend on jQuery 2.1, but they cannot be upgraded. Instead, recreate them with Dashboard Studio.\n\nVersion 1.0 Simple XML dashboards and HTML dashboards will soon no longer be available in future versions of Splunk software.",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "field1",
        "label": "Select Time Range",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "field2",
        "label": "Owner",
        "default": "*",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "field3",
        "label": "App",
        "default": "*",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Number of v1.0 dashboard views",
        "query": "index=_internal sourcetype=splunk_web_service TERM(dashboard_migrate_type=v1.0_load) owner=$field2$ app=$field3$ | timechart count",
        "base": "",
        "text": "",
        "options": {
          "colorBy": "trend",
          "colorMode": "none",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "refresh.display": "progressbar",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "inverse",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "1",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 0,
        "kind": "table",
        "title": "List of v1.0 dashboards viewed",
        "query": "index=_internal sourcetype=splunk_web_service TERM(dashboard_migrate_type=v1.0_load) owner=$field2$ app=$field3$\n| join type=inner app\n\t[ | rest splunk_server=local /servicesNS/-/-/apps/local count=0\n\t| rename title as app label as app_label\n\t| table app app_label]\n| stats count by view_name, owner, app, app_label\n| sort - count",
        "base": "",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "refresh.display": "progressbar",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Number of Simple XML dashboards with CustomJS",
        "query": "| rest splunk_server=local /servicesNS/-/-/data/ui/views search=\"rootNode=form OR rootNode=dashboard\" count=0\n| rename eai:data as xml\n  title as view_name\n  eai:acl.app as app\n  eai:acl.owner as owner\n| search owner=$field2$ app=$field3$\n``` include only dashboards with customjs ```\n| regex xml=\"^<(dashboard|form)(.|\\n)*script[ ]*=[ ]*(?:\\'|\\\").*\\.js(?:\\'|\\\")(.|\\n)*>(.|\\n)*\"\n``` filter out dashboards with version=\"1.1\" explicitly set ```\n| regex xml!=\"^<(dashboard|form)(.|\\n)*version[ ]*=[ ]*(?:\\'|\\\")1.1(?:\\'|\\\")(.|\\n)*>(.|\\n)*\"\n| stats count",
        "base": "",
        "text": "",
        "options": {
          "colorBy": "trend",
          "colorMode": "none",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "refresh.display": "progressbar",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "inverse",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "List of Simple XML dashboards with Custom JS",
        "query": "| rest splunk_server=local /servicesNS/-/-/data/ui/views search=\"rootNode=form OR rootNode=dashboard\" count=0\n| rename eai:data as xml\n  title as view_name\n  eai:acl.app as app\n  eai:acl.owner as owner\n| search owner=$field2$ app=$field3$\n``` include only dashboards with customjs ```\n| regex xml=\"^<(dashboard|form)(.|\\n)*script[ ]*=[ ]*(?:\\'|\\\").*\\.js(?:\\'|\\\")(.|\\n)*>(.|\\n)*\"\n``` filter out dashboards with version=\"1.1\" explicitly set ```\n| regex xml!=\"^<(dashboard|form)(.|\\n)*version[ ]*=[ ]*(?:\\'|\\\")1.1(?:\\'|\\\")(.|\\n)*>(.|\\n)*\"\n| table view_name, owner, app\n| join type=inner app\n\t[ | rest splunk_server=local /servicesNS/-/-/apps/local count=0\n\t| rename title as app label as app_label\n\t| table app app_label]",
        "base": "",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "refresh.display": "progressbar",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Number of HTML dashboards",
        "query": "| rest splunk_server=local /servicesNS/-/-/data/ui/views search=\"eai:type=html\" count=0\n          | rename eai:acl.app as app eai:acl.owner as owner\n          | search owner=$field2$ app=$field3$\n          | stats count",
        "base": "",
        "text": "",
        "options": {
          "colorBy": "trend",
          "colorMode": "none",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "refresh.display": "progressbar",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "inverse",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "List of HTML dashboards",
        "query": "| rest splunk_server=local /servicesNS/-/-/data/ui/views search=\"eai:type=html\" count=0\n| rename title as view_name eai:acl.app as app eai:acl.owner as owner\n| search owner=$field2$ app=$field3$\n| table view_name, owner, app\n| join type=inner app\n\t[ | rest splunk_server=local /servicesNS/-/-/apps/local count=0\n\t| rename title as app label as app_label\n\t| table app app_label]",
        "base": "",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "refresh.display": "progressbar",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      }
    ],
    "sourceSha256": "2d8588ebbc06417943b574822226de42fcaf7a49d111ab65a19013006f75152b"
  },
  {
    "app": "search",
    "id": "licenseusage",
    "label": "License Usage",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "fb0c871079482c97a58d88320682de578c0aff2f886c5b82fae969bf22e2612a"
  },
  {
    "app": "search",
    "id": "live_tail",
    "label": "Live Tail",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c7a9c51919888c8d08b8ea294f5d9b74af67baf883fe9b920bb4a261b0880c9d"
  },
  {
    "app": "search",
    "id": "mod_setup",
    "label": "Mod Setup",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7320ef717aa0a0fe518b681fb7d78a851019982256ed7512c920f7ee2cf52429"
  },
  {
    "app": "search",
    "id": "orphaned_scheduled_searches",
    "label": "Orphaned Scheduled Searches, Reports, and Alerts",
    "description": "",
    "kind": "dashboard",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "These are saved scheduled searches, reports, and alerts with deactivated owners.\n        The scheduler cannot run orphaned scheduled searches. Review these items and disable, delete, or reassign them to a new owner.\n        Learn more",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "List of Orphaned Scheduled Searches, Reports, and Alerts",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "a0b930654d28991345cab932ca0db8e32097c7525da14d7b056afb41d442dcef"
  },
  {
    "app": "search",
    "id": "pivot",
    "label": "Datasets",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c11f5711ae4d664d69153d76acf70630d535e46a5f1c1d11ec6d16c6c103f26a"
  },
  {
    "app": "search",
    "id": "report",
    "label": "Report",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "bb62bd6acb12d87e0cdc4f954d1d105fd634f53e6d41fe97ba1191fa6be4681c"
  },
  {
    "app": "search",
    "id": "report_builder_define_data",
    "label": "Report Builder",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3ae7f0f73d6227d6bc94b9dc329263de13f1dc7ebc76c7d0f7c098821fdc2acc"
  },
  {
    "app": "search",
    "id": "report_builder_display",
    "label": "Display Report",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a02eae83fdcde2b8cc2abfb1b191e549db08e4824b2b4381996d3b3e1d1ea1df"
  },
  {
    "app": "search",
    "id": "report_builder_format_report",
    "label": "Report Builder",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4503236782fa2ce8a7f9540562cd959aa9af0e5fc664eeb2d2d3b98efb70a32d"
  },
  {
    "app": "search",
    "id": "report_builder_print",
    "label": "Display Report",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "056920070ea75f5de75cee2db190ca1ee9e295f123bfffc28519ddb23caad2fc"
  },
  {
    "app": "search",
    "id": "reports",
    "label": "Reports",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0cded6b4ea9eebe57d8a9a081d03145623d40310430fbbb122454c377ac19b80"
  },
  {
    "app": "search",
    "id": "search",
    "label": "Search",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "1a2092ed69dd413f9c8b8d31dd157f1a24abd3cda9c088fdb478e89c3ec5ed13"
  },
  {
    "app": "search",
    "id": "show_source.prod_lite",
    "label": "Show Source",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "47f9f7d8b710e2d6b91c24a1431634d602f511d6809f4325c107114a3f4a358b"
  },
  {
    "app": "search",
    "id": "show_source",
    "label": "Show Source",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "47f9f7d8b710e2d6b91c24a1431634d602f511d6809f4325c107114a3f4a358b"
  },
  {
    "app": "search",
    "id": "table",
    "label": "Table",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3743958fe4f6bdd8c5bbd2751bb05a71a8e4a99b0e67f8839173fc0101132d44"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "dashboard",
    "label": "dashboard",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "d99d349e4aa64d2186cd218b86b1dba1f44567e4ce2dbb8d20197106a3ff088d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-ad-hoc-data",
    "label": "Ad Hoc Data Source",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "55709597bb27bc9e6aa19b3e12510f6d6af958a5c9758192b0da1d80df463160"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-advanced-showhide",
    "label": "Advanced Show/Hide",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "22baabb245bf73f2dd819a652c39df5e1c528348f693f7e74bc1c2ee75af7186"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-airport-kpis-dashboard",
    "label": "Airport KPIs",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0466004cea74eedf3df210a8bc1cb0929d9b3b35b74cf9949224d07de5b16d6d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-area-chart-visualization",
    "label": "Area",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "e742d92bb8baf077f5c5f5c5363906e894006ddf701931423cb40158c5d0466c"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-assembly-line-dashboard",
    "label": "Assembly Line",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c5ab5ff2e6bfddcc8be5a7aa658534736ccb74cfefdb97f1acabbba6a0fba338"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-bar-chart-visualization",
    "label": "Bar",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "1911f9309df2617ff361c2caf2ce5c9d1c334ca2597ab6430c3a53fab31d9c54"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-base-chain-data",
    "label": "Base and Chain Data Sources",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "ecebbb3e9489bf7ebee7cd221f8d14ba17fc1ec91efbb2762ab1102831498e11"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-bubble-chart-visualization",
    "label": "Bubble",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a1e2bc5bcfc5f1702f6efa9ee07fcd709144192973e468da8736b1bfe6d52df6"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-buttercup-games-dashboard",
    "label": "Buttercup Games",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7cea8ffc666c48fbb67750f8f02f7ae14f0cd28f74d7655988c5b2a835aba260"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-cascading-inputs",
    "label": "Cascading Inputs",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "6ee49da49a78dfe5c667b3a5e5365e33d64073f05409e61b1d8ebddc82f05732"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-chart-coloring",
    "label": "Chart Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "215f520a57762707c886a3eed3982818e16ddb9eecc1bb017ffcf24a7519fd35"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-chart-display",
    "label": "Display Axis, Labels, Legends",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c09f1039e4f86510cd0889c21faf5736c45316e7c19d6dd09898f1f94936de8c"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-chart-overlays",
    "label": "Chart Overlays",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "6f6f48910e5c8ae95233331012d62efac75b215ad6aead4928187b677c552ae5"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-chart-scaling",
    "label": "Chart Scaling",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7c5f1674a102f3da1fdfe1552994502e9647aef7d4fed654a7000f4a72017ceb"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-choropleth-svg-visualization",
    "label": "Choropleth SVG",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "e1c7425f491a7ab0471bdf4e1733a09bc962733faf0df560cf34dc384d035468"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-column-chart-visualization",
    "label": "Column",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "1f1b4d0ef51c14502ca8026a7e0bf1fb4b61ff5ed2fd9854268ed4d32fe7373e"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-custom-url-drilldown",
    "label": "Drilldown to Custom URL",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "55539c43fa5ec80d3773dd0c340506ce0f9e0982e443e7b05945ef1d83d54acb"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-customer-satisfaction-dashboard",
    "label": "Customer Satisfaction",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "59d37cec8780da14289da979e0753a6b22ab121a8e109905a1df61bb84c51d0d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-data-command-dashboard",
    "label": "Data Command and Control",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c899840bc0a7c36dca836ad9d430917350ff147c16c38c471c65e5bc9a7fd0f2"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-data-governance-dashboard",
    "label": "Data Governance",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "102c1a532adf55dbd71450c7385f175cfa60064d62ebfdd1d591d396e90a0acb"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-data-streaming-dashboard",
    "label": "Data Streaming",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a1afe1c7a8faba358ed49c9240e3425966f440160453327c708d05a43d920d38"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-datacenter-dashboard",
    "label": "Datacenter Sensors",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a3a09d545422265a43515ad6763bb93aedc1df106238bb7618a8157708689d94"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-dropdown-input",
    "label": "Dropdown",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "44883404bcfe8c2a54fa5a67385e9d9c5efd6da895808992d70c498589811bce"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-ecommerce-monitoring-dashboard",
    "label": "E-Commerce Monitoring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c8362bd72c28e603375ba46d455b874b6d11c283b4f05d107a24597daf909b6f"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-emergency-department-care-dashboard",
    "label": "Emergency Department Care",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "440efeadba4ba3008bf7898bf9c77ea2e784e0a594b89ed59f387be082b47c39"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-europe-telecom-network-hub-dashboard",
    "label": "Europe Telecom Network Hub",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "dae9b8a2a43d0da27595b5e8fa93c896ff295a75014794283e083dc7031d41f8"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-event-annotations",
    "label": "Chart Annotations",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c1bd5d96bfe9d8f431271a9f1c5d3d4df2899ae009217c09ea774e75e74d49ce"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-filler-gauge-coloring",
    "label": "Filler Gauge Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0da1a73a53d3008b2f4ab5f30967dd1c5e147d39d9a66207e389b29578b07f68"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-filler-gauge-visualization",
    "label": "Filler Gauge",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f8956bf32ad195e12be6cc2d215067b1d7bd7e61e07b12cb3a4f176775a784f5"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-healthcare-dashboard",
    "label": "Healthcare Dashboard",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "717069bc8ccbac3ca064f826882cc170fec9db7aae5c98396b9dd763102d6331"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-icon-coloring",
    "label": "Icon Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "ccf9ab2e7234007e0af335ed7100a85cc8d943dde78168171c2845922059be9f"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-icon-visualization",
    "label": "Icons",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0bac82d5e433315c3a28d3bd587bc5ff5476eae491dd4f3a99f39a029ea12e77"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-image-visualization",
    "label": "Images",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "ac4904c8f8776b05796083e3f20113271206a2180181fb8e5491c5cae0b96788"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-line-chart-visualization",
    "label": "Line",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "ed86990fe30e03e22e1e148819ec0cb327233db58f3f79b34ebe3a5c997dffcc"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-link-graph-visualization",
    "label": "Link Graph",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "d394306d11d75a2b01f0228e1795f354e4bc46208d850f6ea984492b9ff51ba2"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-map-visualization",
    "label": "Map",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "b7f015a872d857370ff30658ff5982d7a790c85d26219d8f2e6c02e7a020ca1b"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-markdown-visualization",
    "label": "Markdown",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4adefc07f46a215ebe4ac16c98e4f2c7cd6d3654a4782e5ae94572288d783b62"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-marker-gauge-coloring",
    "label": "Marker Gauge Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "620ed6f560866a2cced6280f88fa5ebf4f4a0675ac27fbcd076e06deaccac0eb"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-marker-gauge-visualization",
    "label": "Marker Gauge",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "cdca02f164e4887d742e2d4dd1d7cc94c2094db978660580646995bd54d07035"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-moving-svg-visualization",
    "label": "Moving SVGs",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "211dbd3ef71c17c91c61dde554ae76d5fcf6c8b7ef9459a996a3b17daa37c2e0"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-multiselect-input",
    "label": "Multiselect",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "e291bb1f48227e7d993da3dae74b83ef8cae6e9ceeef9315e402524c69f9b2be"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-nav-visualizations",
    "label": "Home",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3b90610d91499297f37768483b1fc32c274cfff1e3051f331f238f2540c44bc4"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-number-input",
    "label": "Number Input",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "9814813f1b88dd9350d81bea4081c0216b77e7ef6b9999b56c8e3a937e2c0f06"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-parallel-coordinates-visualization",
    "label": "Parallel Coordinates",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3640bec66586d273c89cddac6256053823bf7f144a1301fe0bd2f24ca0a1658d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-pie-chart-visualization",
    "label": "Pie",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "da4d7391fc2af1d00fa4727a983811e7ae91d8db75d2b053d9ec7fe273546d25"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-progress-bar-defaults",
    "label": "Progress Bar",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "422d038d5c6b9b517129c4646a3a48da6de9a5a3f0afbda433f090cff9f51727"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-punchcard-chart-coloring",
    "label": "Punchcard Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c377f250b420bceba199f2e458cd8b9cc3c5bfaa2e9743ac65e19d4b4a7af89e"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-punchcard-chart-sizing",
    "label": "Punchcard Sizing",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "b0cc4968f1237520422c9075327212ac5d5bc66de4921d0a8d24d581a20c2c2d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-punchcard-chart-visualization",
    "label": "Punchcard",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "b0054f80086af7d6a79e9ec5dd70bc1c9deeabd3405e05ac500a0705a186c753"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-refresh-defaults",
    "label": "Refresh",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3196713a96a56e709cff82c89012d0ca8af93e583d3a3387acc32bb45a861e9c"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-sankey-diagram-visualization",
    "label": "Sankey Diagram",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "d6f37e2ead4246ae55aeae8259695a5574cab7734b2a1ae708f5f2619f083d8b"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-saved-data",
    "label": "Saved Search Data Source",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "33b17e986b52423d8474ebf241941a793793b6557407996242b15d49beb1dcf7"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-scatter-chart-visualization",
    "label": "Scatter",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f94f199e5df44e778f7204a3b960f1e2e29ee1bae46c1abc56037a1d09baab76"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-search-tokens",
    "label": "Evaluate Tokens Using Search",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7f4450d4a03d9a11b613e3699d06a421b18f203cecb0c6684cf16fc82962dbce"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-security-devices-dashboard",
    "label": "Employee Device Security",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "12f3ecd9255b3ae2c5af8998b733cb063c5459f0420a06954b5b43eb5705e3d0"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-security-network-dashboard",
    "label": "VPN Health by Region",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "017439c8990780ac849a106a125f8300ca3c9c35fa9cfd7c0c7085723052460a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-security-summary-dashboard",
    "label": "VPN Health by Region",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "017439c8990780ac849a106a125f8300ca3c9c35fa9cfd7c0c7085723052460a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-set-token-drilldown-default",
    "label": "Set a Token Default",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0efbd0bede669e1a8f79b35cc892d384a56f314e5c967ce3fb37151686d65b28"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-set-token-drilldown",
    "label": "Set Token Drilldown",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "ac5da988745c0d3204ac3841f3b428af4e82c06ba8c6ad9ebc5a05a25413385d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-set-token-search",
    "label": "Set Token from Search",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "98b6a94de2b45c56a02d1b12aa3f415080d6cc72b4e1123c7b07f5ed7ddf328e"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-shape-visualization",
    "label": "Shapes and Lines",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "9b5c899a893b25cdb0741154c8c1dc3d7065185b3d7ecde640bef2a7ba499306"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-coloring",
    "label": "Single Value Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "6116d61a22dd4872d277057748b3c3f5ec6335a2a67be2df8d3664500436749d"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-emojis",
    "label": "Single Value Emoji",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3ac89ec82d1bccf3b786c49dbaf2e83699f894ad556c147cccafb016d7875393"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-icon-visualization",
    "label": "Single Value Icon",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0abb27965d476a31a1393b62c325340eb1424444d4d73cb32a6ffed14fa77b95"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-radial-coloring",
    "label": "Radial Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0eac5dab1501354ffc4d9adf80c53fffb45793c83879d2a890e9f7bba04e2792"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-radial-visualization",
    "label": "Single Value Radial",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4e280d0fc77c484194de91cf85e4373eb57d5b82950d022c6cf9c14b0afdc7b5"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-single-value-visualization",
    "label": "Single Value",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "daf9bdbc377a56f26584cfff56f6c9da730fc1d9080c817afd604c9b29974f52"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-submit-button",
    "label": "Submit Button",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7bb82b59b2a87f9636057f01260db4d41b8c476a12077d8712acd397744dee2a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-table-chart-coloring",
    "label": "Table Coloring",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4c5c2780f4cb1df0d6616c6c47356561d9c13cdec35e0573a9c2e61629e8381a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-table-chart-formatting",
    "label": "Table Formatting",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "2de8ee8f42d5f8e4fd231161b700c1421f16f809357a08dc9cf939af8eabc883"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-table-chart-visualization",
    "label": "Table",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "3c4b588e969c350a7b40fefe4954931925a6bb5f9df51fa7c8c8a25a41a435e4"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-test-data",
    "label": "Test Data Source",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "9d9089012ac3139ea0751746d754db5caa48383856806fba5495129df2640cd8"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-text-input",
    "label": "Text Input",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "62e615f40d5a131cdd7f7d9d0b8bb93d950b66e0909c3e83e3fc1a5f1586a98a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-timerange-input",
    "label": "Time Range Input",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "fef6d3f4ff3c392fa3d6e7500c0d1c1e5e3f83208634020ba19a1d9e27fb22d4"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-trellis-layout",
    "label": "Trellis Layout",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "77ae36b71c12febabca79471eef9a5cd61d30c65af4e84eb31e2718c4ae3deab"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-vpn-health-by-region-dashboard",
    "label": "VPN Health by Region",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "017439c8990780ac849a106a125f8300ca3c9c35fa9cfd7c0c7085723052460a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-workplace-readiness-detail",
    "label": "Workforce Readiness Detail",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "6cd9afa8dd726026adddab675281144bfc2b97d00aa4bbd624620304df8eb85a"
  },
  {
    "app": "splunk-dashboard-studio",
    "id": "example-hub-workplace-readiness",
    "label": "Workforce Readiness",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a8b9af9dd2ea25cb6854c903539a2be85d8cc2ee57a55a8c91cf72128bd0ac0e"
  },
  {
    "app": "splunk_assist",
    "id": "start",
    "label": "Start",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "68ed034181eecd4a5128f8d546cddb492cf05010064146639b43c29020d00a96"
  },
  {
    "app": "splunk_metrics_workspace",
    "id": "analysis_workspace",
    "label": "Analytics",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "00be3e30426d940d39f7053ea8f71ff6dbfe72c15340ab2aa2936cae2429ad13"
  },
  {
    "app": "splunk_metrics_workspace",
    "id": "analytics_workspace",
    "label": "Analytics",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0f2957482a5b1d36acccd2262ba0062da88ad7953e442b230314df3ea87f1974"
  },
  {
    "app": "splunk_metrics_workspace",
    "id": "home",
    "label": "Home",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "620ed913c8fa1b18a1845dda3e982b7d9f396a1df91d3d4afb719a353416328a"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "admission_control_monitoring_distributed",
    "label": "Workload Management Admission Control: Distributed",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Total Searches Prefiltered (Last Hour)",
        "query": "`dmc_event_local_search_dispatch`\n            | stats dc(search_id) as total_dispatched\n            | eval output_with_percentage = \"$total_prefiltered$\".\" (\".round($total_prefiltered$/($total_prefiltered$ + total_dispatched) * 100, 2).\" %)\"\n            | fields output_with_percentage",
        "base": "",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Adhoc Searches Prefiltered (Last Hour)",
        "query": "| where search_type=\"adhoc\"\n            | fields count",
        "base": "base_search_prefiltered",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Scheduled Searches Prefiltered (Last Hour)",
        "query": "| where search_type=\"scheduled\"\n            | fields count",
        "base": "base_search_prefiltered",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Count of Prefiltered Searches",
        "query": "sort - count\n            | eval percent = round(count / $total_prefiltered_searches$ * 100, 2).\" %\"\n            | rename prefilter_rule as Rule, user as User, app as App, search_type as \"Search Type\", search_name as \"Search Name\", host as Instance, count as Count, percent as \"Percent of Total\"",
        "base": "prefiltered_searches_count_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Count of Prefiltered Searches Over Time",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ sourcetype=wlm_* prefilter_action=filter\n          | `dmc_timechart` partial=f bins=200 count by $TimechartSplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# of searches",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Scheduled Searches Prefiltered",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ sourcetype=wlm_* search_type=\"scheduled*\" prefilter_action=filter\n            | stats count as prefiltered_count by prefilter_rule, user, app, host, search_name\n            | fields search_name, app, user, host, prefilter_rule, prefiltered_count\n            | sort - prefiltered_count\n            | rename search_name as \"Search Name\", app as App, user as User, host as Instance, prefilter_rule as \"Prefiltering Rule Triggered\", prefiltered_count as \"Prefiltered Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Scheduled Searches Prefiltered Drilldown: $scheduled_search_drilldown$",
        "query": "| rest [inputlookup dmc_assets | where host = $scheduled_search_host_drilldown|s$ | rename serverName AS splunk_server | return splunk_server] \"/servicesNS/-/-/saved/searches/$scheduled_search_drilldown$\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | fields cron_schedule, next_scheduled_time, search \n            | rename cron_schedule as \"Cron Schedule\", next_scheduled_time as \"Next Scheduled Time\", search as \"Search\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Scheduled Searches Prefiltered Drilldown: $scheduled_search_drilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      }
    ],
    "sourceSha256": "7a4ecca9ef77301d5da563fe35689a51d82d55f2110a6c1d20b99e5983bbf456"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "admission_control_monitoring_instance",
    "label": "Workload Management Admission Control: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Total Searches Prefiltered (Last Hour)",
        "query": "`dmc_event_local_search_dispatch`\n            | stats dc(search_id) as total_dispatched\n            | eval output_with_percentage = \"$total_prefiltered$\".\" (\".round($total_prefiltered$/($total_prefiltered$ + total_dispatched) * 100, 2).\" %)\"\n            | fields output_with_percentage",
        "base": "",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Adhoc Searches Prefiltered (Last Hour)",
        "query": "| where search_type=\"adhoc\"\n            | fields count",
        "base": "base_search_prefiltered",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Scheduled Searches Prefiltered (Last Hour)",
        "query": "| where search_type=\"scheduled\"\n            | fields count",
        "base": "base_search_prefiltered",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Count of Prefiltered Searches",
        "query": "sort - count\n            | eval percent = round(count / $total_prefiltered_searches$ * 100, 2).\" %\"\n            | rename prefilter_rule as Rule, user as User, app as App, search_type as \"Search Type\", search_name as \"Search Name\", count as Count, percent as \"Percent of Total\"",
        "base": "prefiltered_searches_count_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Count of Prefiltered Searches Over Time",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=wlm_* prefilter_action=filter\n          | `dmc_timechart` partial=f bins=200 count by $TimechartSplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# of searches",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Scheduled Searches Prefiltered",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=wlm_* search_type=\"scheduled*\" prefilter_action=filter\n            | stats count as prefiltered_count by prefilter_rule, user, app, search_name\n            | fields search_name, app, user, prefilter_rule, prefiltered_count\n            | sort - prefiltered_count\n            | rename search_name as \"Search Name\", app as App, user as User, prefilter_rule as \"Prefiltering Rule Triggered\", prefiltered_count as \"Prefiltered Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Scheduled Searches Prefiltered Drilldown: $scheduled_search_drilldown$",
        "query": "| rest splunk_server=$splunk_server$ \"/servicesNS/-/-/saved/searches/$scheduled_search_drilldown$\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | fields cron_schedule, next_scheduled_time, search \n            | rename cron_schedule as \"Cron Schedule\", next_scheduled_time as \"Next Scheduled Time\", search as \"Search\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Scheduled Searches Prefiltered Drilldown: $scheduled_search_drilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      }
    ],
    "sourceSha256": "ebe50eee9937bf6c5ee4ec1d407b63b16215f0043ea3989184b5a8ec42c9067d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "alerts.prod_lite",
    "label": "Alerts",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "97e52e043d75a6b18f4748f613a76d6e9e5d5d03c02fd0df8cc6e7e14556fa7a"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "alerts",
    "label": "Alerts",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20a964dd15c0ad5d9fdcc8e9ef59641d994dcffcbb8227441364b817941e0d88"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "assist",
    "label": "Assist",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0f26989ed3097e676c280fc5601d0f9ba025f247f19563beeca082cc965baa1a"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "bundle_replication",
    "label": "Knowledge Bundle Replication",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "All Search Heads"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "| fields replicationPolicy\n                | eval replicationPolicy = upper(substr(replicationPolicy,1,1)).substr(replicationPolicy,2)",
        "base": "replication_config_api_base",
        "text": "",
        "options": {
          "underLabel": "Replication Policy",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "| eval replicationThreads = case(isnull(replicationThreads), \"N/A\", isnotnull(replicationThreads), replicationThreads)\n                | fields replicationThreads",
        "base": "replication_config_api_base",
        "text": "",
        "options": {
          "underLabel": "Replication Threads",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                  bundle_type=full_bundle\n                  | eval repl_sec = replication_time_msec/1000\n                  | stats avg(repl_sec)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Average Full Bundle Replication Time",
          "afterLabel": "sec",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                  bundle_type=delta_bundle\n                  | eval repl_sec = replication_time_msec/1000\n                  | stats avg(repl_sec)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Average Delta Bundle Replication Time",
          "afterLabel": "sec",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundle_replication name=bundle_metadata\n                  bundle_type=full_bundle\n                  | eval size_mb = round(bundle_bytes /1024 / 1024, 2)\n                  | stats avg(size_mb)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Average Full Bundle Size",
          "afterLabel": "MB",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundle_replication name=bundle_metadata\n                  bundle_type=delta_bundle\n                  | eval size_mb = round(bundle_bytes /1024 / 1024, 2)\n                  | stats avg(size_mb)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Average Delta Bundle Size",
          "afterLabel": "MB",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Latest Common Bundle Across All Peers",
        "query": "| eval upload_time=\"Created at: \".(strftime(upload_time, \"%m/%d/%Y %H:%M:%S %p\"))\n                  | fields upload_time",
        "base": "common_bundle_base",
        "text": "",
        "options": {
          "height": "50%"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Latest Common Bundle Across All Peers",
        "query": "| rex field=id \"(?<id>([^\\/]+$))\"\n                  | eval id = \"Bundle Id: \".tostring(id)\n                  | fields id",
        "base": "common_bundle_base",
        "text": "",
        "options": {
          "height": "50%"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Latest Common Bundle Across All Peers",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Latest Common Bundle Across All Peers",
        "query": "| eval checksum = \"Checksum: \".tostring(checksum)\n                  | fields checksum",
        "base": "common_bundle_base",
        "text": "",
        "options": {
          "height": "50%"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Latest Common Bundle Across All Peers",
        "query": "| appendpipe [\n                    stats count\n                    | eval checksum=\"No common knowledge bundle found across all peers\"\n                    | where count=0]\n                  | fields checksum",
        "base": "common_bundle_base",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Replication Cycle Count",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundle_replication name=cycle_dispatch\n                | stats count",
        "base": "",
        "text": "",
        "options": {
          "height": "100%"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count",
        "query": "",
        "base": "",
        "text": "The number of cycles dispatched from the search head.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Replication Cycle Count by Peer Success Ratio",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundle_replication name=cycle_dispatch\n                | eval ratio = round((peer_success_count/peer_count)*100, 2)\n                | stats count by ratio\n                | rename ratio as \"Peer Success Ratio\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "height": "200px",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Replication Cycle Count by Peer Success Ratio",
        "query": "",
        "base": "",
        "text": "Peer success ratio is the ratio of peers that received the bundles in a cycle successfully, to all intended peers.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Average Bundle Replication Time by Bundle Type",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n              | eval repl_sec = replication_time_msec/1000\n              | `dmc_timechart_for_metrics_log` avg(repl_sec) by bundle_type",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Replication Time (sec)"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Average Bundle Size by Bundle Type",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundle_replication name=bundle_metadata\n                | eval size_mb = round(bundle_bytes /1024 / 1024, 2)\n                | `dmc_timechart_for_metrics_log` avg(size_mb) by bundle_type",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Bundle Size (MB)"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Bundle Replication Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                     | eval repl_sec = replication_time_msec/1000\n                     | `dmc_timechart_for_metrics_log` avg(repl_sec) AS avg_repl_time p90(repl_sec) AS 90th_perc_repl_time p10(repl_sec) AS 10th_perc_repl_time",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Replication Time (sec)"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Bundle Replication Activity",
        "query": "",
        "base": "",
        "text": "Average, 90th percentile, and 10th percentile of bundle replication time, in seconds.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Bundle Replication Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                     | eval repl_sec = replication_time_msec/1000\n                     | `dmc_timechart_for_metrics_log` limit=50 avg(repl_sec) AS avg_repl_time by peer_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Replication Time (sec)"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Bundle Replication Activity",
        "query": "",
        "base": "",
        "text": "Average bundle replication time, in seconds, grouped by peer. Only 50 peers are visible.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Average Bundle Replication Time and Size",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                | stats avg(replication_time_msec) AS avg_time by peer_name\n                | eval avg_time=round(avg_time/1000, 2)\n                | rename avg_time AS \"Replication Time (sec)\"\n                | appendcols [\n                  search `dmc_set_index_internal` host=$host$ source=*metrics.log* group=bundles_uploads name=peer_dispatch\n                  | join type=inner bundle_id [\n                    search `dmc_set_index_internal` source=*metrics.log* group=bundle_replication name=bundle_metadata]\n                  | stats avg(bundle_bytes) AS avg_size by peer_name\n                  | eval avg_size = round(avg_size /1024 / 1024, 2)\n                  | rename avg_size AS \"Bundle Size (MB)\"]\n                | rename peer_name AS \"Peer\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Knowledge Bundle Replication Warnings and Errors Over Time",
        "query": "`dmc_set_index_internal` (search_group=dmc_group_indexers OR search_group=dmc_group_search_head) source=*splunkd.log*\n              (component=BundlesAdminHandler OR  component=BundleDataProcessor OR component=BundleDeltaHandler OR\n              component=BundleReplicationProvider OR component=BundleStatusManager OR component=BundleTransaction OR\n              component=CascadePlan OR component=CascadeReplicationReaper OR component=CascadingBundleReplicationProvider OR\n              component=CascadingReplicationManager OR component=CascadingReplicationTransaction OR \n              component=CascadingReplicationStatusActor OR component=CascadingUploadHandler OR component=ClassicBundleReplicationProvider OR\n              component=DistBundleRestHandler OR component=DistributedBundleReplicationManager OR\n              component=GetCascadingReplicationStatusTransaction OR component=RFSManager OR component=RFSBundleReplicationProvider)\n              (log_level=WARN OR log_level=ERROR)\n              | timechart bins=200 partial=f count by component",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Event Count"
        }
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Knowledge Bundle Replication Warnings and Errors By Component",
        "query": "`dmc_set_index_internal` (search_group=dmc_group_indexers OR search_group=dmc_group_search_head) source=*splunkd.log*\n              (component=BundlesAdminHandler OR  component=BundleDataProcessor OR component=BundleDeltaHandler  OR\n              component=BundleReplicationProvider OR component=BundleStatusManager OR component=BundleTransaction OR\n              component=CascadePlan OR component=CascadeReplicationReaper OR component=CascadingBundleReplicationProvider OR component=CascadingReplicationManager OR component=CascadingReplicationTransaction OR component=CascadingReplicationStatusActor OR component=CascadingUploadHandler OR component=ClassicBundleReplicationProvider OR component=DistBundleRestHandler OR\n              component=DistributedBundleReplicationManager OR component=GetCascadingReplicationStatusTransaction OR\n              component=RFSManager OR component=RFSBundleReplicationProvider)\n              (log_level=WARN OR log_level=ERROR)\n              | chart count by component, log_level\n              | sort - ERROR, WARN",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "charting.axisTitleX.text": "Component",
          "charting.axisTitleY.text": "Event Count",
          "charting.fieldColors": "{\"WARN\": 0xF2B827, \"ERROR\": 0xAF575A}"
        }
      }
    ],
    "sourceSha256": "7665b0cb2d3f09db44d9f8ddacce846a0031c2f8ed51bcbeb015b7e3cd71bac3"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "cascading_replication",
    "label": "Cascading Replication",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers (Search Peers)"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "",
        "query": "| fields replicationPolicy\n              | eval replicationPolicy = upper(substr(replicationPolicy,1,1)).substr(replicationPolicy,2)",
        "base": "replication_config_api_base",
        "text": "",
        "options": {
          "underLabel": "Replication Policy",
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "",
        "query": "| fields replicationThreads",
        "base": "replication_config_api_base",
        "text": "",
        "options": {
          "underLabel": "Replication Threads",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Cascading Replication is disabled. Set replicationPolicy = cascading under the [replicationSettings] stanza in distsearch.conf to enable.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Plan Count by Number of Levels",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=plan_metadata\n               | dedup planid\n               | stats count by num_levels",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Plan Count by Number of Levels",
        "query": "",
        "base": "",
        "text": "The search head is one level. Cascading replication occurs when there are at least \n             three levels: The search head sends the payload to a subset of search peers, which in turn \n             distribute the payload to their own set of search peers, and so on.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Plan Count by Number of Peers",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=plan_metadata\n               | dedup planid\n               | stats count by num_peers",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Plan Count by Number of Peers",
        "query": "",
        "base": "",
        "text": "Count of plans by number of peers involved.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Plan Count by Replication Type",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=plan_metadata\n               | dedup planid\n               | stats count by endpoint",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Plan Count by Replication Type",
        "query": "",
        "base": "",
        "text": "Count of plans by replication type.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Plan Count by Number of Receivers",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=plan_replication\n               | dedup planid\n               | stats count by num_receivers",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Plan Count by Number of Receivers",
        "query": "",
        "base": "",
        "text": "Count of plans by number of intended receivers.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Payload Count by Number of Receivers",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=payload_replication\n               | dedup planid\n               | stats count by num_receivers",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Payload Count by Number of Receivers",
        "query": "",
        "base": "",
        "text": "Count of payloads by number of intended receivers.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Plan and Payload Replication Status",
        "query": "| multisearch\n                 [search `dmc_set_index_internal` source=*metrics.log group=cascading name=plan_replication]\n                 [search `dmc_set_index_internal` source=*metrics.log group=cascading name=payload_replication]\n               | chart count over name by status\n               | replace payload_replication WITH payload\n               | replace plan_replication WITH plan\n               | rename name as \"Replication Type\" \n               | sort -\"Replication Type\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Replication Type",
          "charting.axisTitleY.text": "Status Count",
          "charting.fieldColors": "{\"success\": 0x4FA484, \"failure\": 0xAF575A}"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Plan and Payload Replication Status",
        "query": "",
        "base": "",
        "text": "Count of plans and payloads by status; success indicates successful replication to all intended peers.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Plan Replication Performance",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=plan_replication\n               | dedup planid\n               | `dmc_timechart_for_metrics_log` avg(dispatch_time_ms) AS avg_plan_msec",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (msec)"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Plan Replication Performance",
        "query": "",
        "base": "",
        "text": "\"Time spent\" is the average msec for the search head to send a plan to all search peers.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Payload Replication Performance",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer source=*metrics.log* group=cascading name=payload_replication\n               | dedup planid\n               | eval dispatch_time_sec=dispatch_time_ms/1000\n               | `dmc_timechart_for_metrics_log` avg(dispatch_time_sec) AS avg_payload_sec",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (sec)"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Payload Replication Performance",
        "query": "",
        "base": "",
        "text": "\"Time spent\" is the average sec for a sender peer (the search head or any other sender peer)\n            to send a payload to all of its receivers.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Payload Replication Performance",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer source=*metrics.log* group=cascading name=payload_replication\n               | dedup planid\n               | eval dispatch_time_sec=dispatch_time_ms/1000\n               | `dmc_timechart_for_metrics_log` avg(dispatch_time_sec) by peer_guid",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (sec)"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Payload Replication Performance",
        "query": "",
        "base": "",
        "text": "Time spent is the average sec for the given peer (which may be the search head, or any other sender peer)\n            to send a payload to all of its receivers.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Average Peer Time to Receive Payload",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log* group=cascading name=per_peer_replication\n               | dedup planid\n               | stats avg(repl_time_ms) AS avg_time by peer_uri\n               | eval avg_time=round(avg_time, 2)\n               | rename avg_time AS \"Time To Receive (msec)\"\n               | rename peer_uri AS \"Peer URI\"\n               | sort 0 - \"Time to Receive (msec)\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Average Peer Time to Receive Payload",
        "query": "",
        "base": "",
        "text": "\"Time to receive\" is the average time for a peer to receive a payload from its sender.",
        "options": {}
      }
    ],
    "sourceSha256": "a900ed73ef31997d3b931c4f6d62a5ee2b5ea301a828f502c111b8222f5ac26d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "dashboards.prod_lite",
    "label": "Dashboards",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f77888b6d16a2c2030477c49d49312018e72d16b7f0892131f51d756797adcfc"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "dashboards",
    "label": "Dashboards",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "76af1d8adf98be3448cc1643208d62adf6c41ad6d6385aab946e19a926409020"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "data_quality.env_cloud",
    "label": "Data Quality",
    "description": "This dashboard helps you assess the quality of your incoming data by revealing issues that\n      occur when the data is being indexed. These issues appear as warnings and errors in your splunkd.log.",
    "kind": "dashboard",
    "inputs": [
      {
        "type": "time",
        "token": "time",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Event Processing Issues by Source Type",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer source=*splunkd.log*\n            (component=AggregatorMiningProcessor OR component=LineBreakingProcessor OR component=DateParserVerbose OR component=MetricSchemaProcessor OR component=MetricsProcessor)\n            (log_level=WARN OR log_level=ERROR)\n            | rex field=event_message \"Context: source::(?<context_source>[^\\|]*?)\\|host::(?<context_host>[^\\|]*?)\\|(?<context_sourcetype>[^\\|]*?)\\|\"\n            | eval data_source = if(isnull(data_source) AND isnotnull(context_source), context_source, data_source)\n            | eval data_sourcetype = if(isnull(data_sourcetype) AND isnotnull(context_sourcetype), context_sourcetype, data_sourcetype)\n            | stats\n              count(eval(component==\"LineBreakingProcessor\" OR component==\"DateParserVerbose\" OR component==\"AggregatorMiningProcessor\" OR component==\"MetricSchemaProcessor\" OR component==\"MetricsProcessor\")) as total_issues\n              dc(data_source) AS \"Source Count\"\n              count(eval(component==\"LineBreakingProcessor\")) AS \"Line Breaking Issues\"\n              count(eval(component==\"DateParserVerbose\")) AS \"Timestamp Parsing Issues\"\n              count(eval(component==\"AggregatorMiningProcessor\")) AS \"Aggregation Issues\"\n              count(eval(component==\"MetricSchemaProcessor\")) AS \"Metric Schema Issues\"\n              count(eval(component==\"MetricsProcessor\")) AS \"Metrics Issues\" by data_sourcetype\n            | sort - total_issues\n            | rename\n              data_sourcetype as Sourcetype\n              total_issues as \"Total Issues\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source type shows issues by source, helping you locate the origin of this data.\n          [Show more info]",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source type shows issues by source, helping you locate the origin of this data.\n          [Show less info]",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This table shows errors and warnings emitted when the index-time settings in place do not allow for the\n          proper processing of ingested data. Issues in this table indicate the presence of one or more of these scenarios:\n        \n        \n          \n            Line Breaking Issues -  Lines in the event are too long and exceed the TRUNCATE setting in props.conf.\n            Learn More.\n          \n          \n            Timestamp Parsing Issues - The extraction of event time stamps was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Aggregation Issues - The number of lines per event exceeds the MAX_EVENTS setting in props.conf.\n            Learn More.\n          \n          \n            Metric Schema Issues - The conversion of log events to metric data was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Metrics Issues - The collection of metric data was partially or completely unsuccessful.\n            Learn More.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Issues for source type $sourcetype$ by source",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer source=*splunkd.log*\n            (component=AggregatorMiningProcessor OR component=LineBreakingProcessor OR component=DateParserVerbose OR component=MetricSchemaProcessor OR component=MetricsProcessor)\n            (log_level=WARN OR log_level=ERROR)\n            | rex field=event_message \"Context: source::(?<context_source>[^\\|]*?)\\|host::(?<context_host>[^\\|]*?)\\|(?<context_sourcetype>[^\\|]*?)\\|\"\n            | eval data_source = if(isnull(data_source) AND isnotnull(context_source), context_source, data_source)\n            | eval data_sourcetype = if(isnull(data_sourcetype) AND isnotnull(context_sourcetype), context_sourcetype, data_sourcetype)\n            | search data_sourcetype=$sourcetype$\n            | stats\n              count(eval(component==\"LineBreakingProcessor\" OR component==\"DateParserVerbose\" OR component==\"AggregatorMiningProcessor\" OR component==\"MetricSchemaProcessor\" OR component=\"MetricsProcessor\")) as total_issues\n              count(eval(component==\"LineBreakingProcessor\")) AS \"Line Breaking Issues\"\n              count(eval(component==\"DateParserVerbose\")) AS \"Timestamp Parsing Issues\"\n              count(eval(component==\"AggregatorMiningProcessor\")) AS \"Aggregation Issues\"\n              count(eval(component==\"MetricSchemaProcessor\")) AS \"Metric Schema Issues\"\n              count(eval(component==\"MetricsProcessor\")) AS \"Metrics Issues\" by data_source\n            | sort - total_issues\n            | rename\n              data_source as Source\n              total_issues as \"Total Issues\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source shows statistics for events from that source.\n          [Show more info]",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source shows statistics for events from that source.\n          [Show less info]",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This table shows errors and warnings emitted when the index-time settings in place do not allow for the\n          proper processing of ingested data. Issues in this table indicate the presence of one or more of these scenarios:\n        \n        \n          \n            Line Breaking Issues -  Lines in the event are too long and exceed the TRUNCATE setting in props.conf.\n            Learn More.\n          \n          \n            Timestamp Parsing Issues - The extraction of event time stamps was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Aggregation Issues - The number of lines per event exceeds the MAX_EVENTS setting in props.conf.\n            Learn More.\n          \n          \n            Metric Schema Issues - The conversion of log events to metric data was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Metrics Issues - The collection of metric data was partially or completely unsuccessful.\n            Learn More.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "[Close this panel]",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Event Line Count",
        "query": "| stats sum(count) as \"Event Count\" by linecount\n            | rename linecount as \"Line Count\"",
        "base": "distribution_base",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Learn More.\n        \n        \n          [Close these panels]",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Event Size",
        "query": "| bin event_size span=log2\n            | stats sum(count) as \"Event Count\" by event_size\n            | rename event_size as \"Event Size (bytes)\"",
        "base": "distribution_base",
        "text": "",
        "options": {
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Learn More.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Event Time Disparity",
        "query": "| bin time_disparity span=1 start=-24 end=-24\n            | stats sum(count) as \"Event Count\" by time_disparity\n            | rename time_disparity as \"Observed Latency (hours)\"",
        "base": "distribution_base",
        "text": "",
        "options": {
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Latency = _indextime - _time.\n        If the latency is off by multiples of approximately an hour, you might have a timezone configuration issue.\n        If the latency is suspiciously large, there is a possibility the timestamp is extracted incorrectly.\n        Learn More.",
        "options": {}
      }
    ],
    "sourceSha256": "deecf76a2e06a100ccf1c0c66f118970097d3d02ce23c50ec83a1c964536267d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "data_quality",
    "label": "Data Quality",
    "description": "This dashboard helps you assess the quality of your incoming data by revealing issues that\n      occur when the data is being indexed. These issues appear as warnings and errors in your splunkd.log.",
    "kind": "dashboard",
    "inputs": [
      {
        "type": "time",
        "token": "time",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All indexers of selected group"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Event Processing Issues by Source Type",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer splunk_server=$splunk_server$ source=*splunkd.log*\n            (component=AggregatorMiningProcessor OR component=LineBreakingProcessor OR component=DateParserVerbose OR component=MetricSchemaProcessor OR component=MetricsProcessor)\n            (log_level=WARN OR log_level=ERROR)\n            | rex field=event_message \"Context: source(::|=)(?<context_source>[^\\|]*?)\\|host(::|=)(?<context_host>[^\\|]*?)\\|(?<context_sourcetype>[^\\|]*?)\\|\"\n            | eval data_source = if(isnull(data_source) AND isnotnull(context_source), context_source, data_source)\n            | eval data_host = if(isnull(data_host) AND isnotnull(context_host), context_host, data_host)\n            | eval data_sourcetype = if(isnull(data_sourcetype) AND isnotnull(context_sourcetype), context_sourcetype, data_sourcetype)\n            | stats\n              count(eval(component==\"LineBreakingProcessor\" OR component==\"DateParserVerbose\" OR component==\"AggregatorMiningProcessor\" OR component==\"MetricSchemaProcessor\" OR component==\"MetricsProcessor\")) as total_issues\n              dc(data_host) AS \"Host Count\"\n              dc(data_source) AS \"Source Count\"\n              count(eval(component==\"LineBreakingProcessor\")) AS \"Line Breaking Issues\"\n              count(eval(component==\"DateParserVerbose\")) AS \"Timestamp Parsing Issues\"\n              count(eval(component==\"AggregatorMiningProcessor\")) AS \"Aggregation Issues\"\n              count(eval(component==\"MetricSchemaProcessor\")) AS \"Metric Schema Issues\"\n              count(eval(component==\"MetricsProcessor\")) AS \"Metrics Issues\" by data_sourcetype\n            | sort - total_issues\n            | rename\n              data_sourcetype as Sourcetype\n              total_issues as \"Total Issues\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source type shows issues by host and source, helping you locate the origin of this data.\n          [Show more info]",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a source type shows issues by host and source, helping you locate the origin of this data.\n          [Show less info]",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This table shows errors and warnings emitted when the index-time settings in place do not allow for the\n          proper processing of ingested data. Issues in this table indicate the presence of one or more of these scenarios:\n        \n        \n          \n            Line Breaking Issues -  Lines in the event are too long and exceed the TRUNCATE setting in props.conf.\n            Learn More.\n          \n          \n            Timestamp Parsing Issues - The extraction of event time stamps was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Aggregation Issues - The number of lines per event exceeds the MAX_EVENTS setting in props.conf.\n            Learn More.\n          \n          \n            Metric Schema Issues - The conversion of log events to metric data was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Metrics Issues - The collection of metric data was partially or completely unsuccessful.\n            Learn More.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Issues for source type $sourcetype$ by host and source",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer splunk_server=$splunk_server$ source=*splunkd.log*\n            (component=AggregatorMiningProcessor OR component=LineBreakingProcessor OR component=DateParserVerbose OR component=MetricSchemaProcessor OR component=MetricsProcessor)\n            (log_level=WARN OR log_level=ERROR)\n            | rex field=event_message \"Context: source(::|=)(?<context_source>[^\\|]*?)\\|host(::|=)(?<context_host>[^\\|]*?)\\|(?<context_sourcetype>[^\\|]*?)\\|\"\n            | eval data_source = if(isnull(data_source) AND isnotnull(context_source), context_source, data_source)\n            | eval data_host = if(isnull(data_host) AND isnotnull(context_host), context_host, data_host)\n            | eval data_sourcetype = if(isnull(data_sourcetype) AND isnotnull(context_sourcetype), context_sourcetype, data_sourcetype)\n            | search data_sourcetype=$sourcetype$\n            | stats\n              count(eval(component==\"LineBreakingProcessor\" OR component==\"DateParserVerbose\" OR component==\"AggregatorMiningProcessor\" OR component==\"MetricSchemaProcessor\" OR component=\"MetricsProcessor\")) as total_issues\n              count(eval(component==\"LineBreakingProcessor\")) AS \"Line Breaking Issues\"\n              count(eval(component==\"DateParserVerbose\")) AS \"Timestamp Parsing Issues\"\n              count(eval(component==\"AggregatorMiningProcessor\")) AS \"Aggregation Issues\"\n              count(eval(component==\"MetricSchemaProcessor\")) AS \"Metric Schema Issues\"\n              count(eval(component==\"MetricsProcessor\")) AS \"Metrics Issues\" by data_host, data_source\n            | sort - total_issues\n            | rename\n              data_host as Host\n              data_source as Source\n              total_issues as \"Total Issues\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a host or source shows statistics for events from that host and source.\n          [Show more info]",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Clicking a host or source shows statistics for events from that host and source.\n          [Show less info]",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This table shows errors and warnings emitted when the index-time settings in place do not allow for the\n          proper processing of ingested data. Issues in this table indicate the presence of one or more of these scenarios:\n        \n        \n          \n            Line Breaking Issues -  Lines in the event are too long and exceed the TRUNCATE setting in props.conf.\n            Learn More.\n          \n          \n            Timestamp Parsing Issues - The extraction of event time stamps was partially or completely unsuccessful.\n              Learn More.\n          \n          \n            Aggregation Issues - The number of lines per event exceeds the MAX_EVENTS setting in props.conf.\n            Learn More.\n          \n          \n            Metric Schema Issues - The conversion of log events to metric data was partially or completely unsuccessful.\n            Learn More.\n          \n          \n            Metrics Issues - The collection of metric data was partially or completely unsuccessful.\n            Learn More.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "[Close this panel]",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Event Line Count",
        "query": "| stats sum(count) as \"Event Count\" by linecount\n            | rename linecount as \"Line Count\"",
        "base": "distribution_base",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Learn More.\n        \n        \n          [Close these panels]",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Event Size",
        "query": "| bin event_size span=log2\n            | stats sum(count) as \"Event Count\" by event_size\n            | rename event_size as \"Event Size (bytes)\"",
        "base": "distribution_base",
        "text": "",
        "options": {
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Learn More.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Event Time Disparity",
        "query": "| bin time_disparity span=1 start=-24 end=-24\n            | stats sum(count) as \"Event Count\" by time_disparity\n            | rename time_disparity as \"Observed Latency (hours)\"",
        "base": "distribution_base",
        "text": "",
        "options": {
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Latency = _indextime - _time.\n        If the latency is off by multiples of approximately an hour, you might have a timezone configuration issue.\n        If the latency is suspiciously large, there is a possibility the timestamp is extracted incorrectly.\n        Learn More.",
        "options": {}
      }
    ],
    "sourceSha256": "1e07b294d55987f2031c9a388e90ed2888ee84e757ddcd99c0fcd04a40d13812"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "disk_usage_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "distributed_search_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "distributed_search_deployment",
    "label": "Distributed Search: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers (Search Peers)"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "where status!=\"Up\"\n            | stats dc(splunk_server) as down_count, values(splunk_server) as splunk_server",
        "base": "peer_status_health_api_base",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "down_count",
          "splunk_monitoring_console.KpiTrafficLight.detail": "splunk_server",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"All search heads' peers are up.\", \"$down_count$ search heads have peers that are not up.\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "where health_status!=\"Healthy\"\n            | stats dc(splunk_server) as unhealthy_count, values(splunk_server) as splunk_server",
        "base": "peer_status_health_api_base",
        "text": "",
        "options": {
          "height": "50",
          "splunk_monitoring_console.KpiTrafficLight.field": "unhealthy_count",
          "splunk_monitoring_console.KpiTrafficLight.detail": "splunk_server",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"All search heads' peers are healthy.\", \"$unhealthy_count$ search heads have peers that are unhealthy.\"]"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "$instances_snapshot_title$ ($instance_count$)",
        "query": "| rest splunk_server_group=$role|h$ splunk_server_group=\"$group$\" /services/server/introspection/search/distributed/window_metrics\n            | eval avg_baseline_mb = if(isNotNull(average_baseline_file_size), round(average_baseline_file_size /1024 / 1024, 2), \"Unknown\")\n            | eval avg_sec = round(average_msecs / 1000, 2)\n            | eval bundle_file_count = if(isNotNull(bundle_file_count), bundle_file_count, count)\n            | fields splunk_server, bundle_file_count, avg_baseline_mb, avg_sec\n            | join type=outer splunk_server [\n              | rest splunk_server_group=$role|h$ splunk_server_group=\"$group$\" /services/search/distributed/peers\n              | stats count as peer_count by splunk_server\n            ]\n            | join type=outer splunk_server [\n              | rest splunk_server_group=$role|h$ splunk_server_group=\"$group$\" /services/server/introspection/search/dispatch/Bundle_Directory_Reaper\n              | eval Bundle_Directory_Reaper_Average_Time(ms) = round('Bundle_Directory_Reaper_Average_Time(ms)')\n              | eval Bundle_Directory_Reaper_Max_Time(ms) = round('Bundle_Directory_Reaper_Max_Time(ms)')\n              | fields splunk_server, \"Bundle_Directory_Reaper_Average_Time(ms)\", \"Bundle_Directory_Reaper_Max_Time(ms)\"\n            ]\n            | join type=outer splunk_server [\n              | rest splunk_server_group=$role|h$ splunk_server_group=\"$group$\" /services/server/introspection/search/dispatch/Dispatch_Directory_Reaper\n              | eval Dispatch_Directory_Reaper_Average_Time(ms) = round('Dispatch_Directory_Reaper_Average_Time(ms)')\n              | eval Dispatch_Directory_Reaper_Max_Time(ms) = round('Dispatch_Directory_Reaper_Max_Time(ms)')\n              | fields splunk_server, \"Dispatch_Directory_Reaper_Average_Time(ms)\", \"Dispatch_Directory_Reaper_Max_Time(ms)\"\n            ]\n            | $instance_fields_filter$\n            | rename splunk_server as Instance, peer_count as \"Peer Count\", bundle_file_count as \"Knowledge Bundle Replication Count\", avg_baseline_mb as \"Average Size of Baseline Knowledge Bundle (MB)\", avg_sec as \"Average Time Spent on Knowledge Bundle Replication (sec)\", \"Bundle_Directory_Reaper_Average_Time(ms)\" as \"Average Time to Reap Knowledge Bundle Directory (ms)\", \"Bundle_Directory_Reaper_Max_Time(ms)\" as \"Max Time to Reap Knowledge Bundle Directory (ms)\", \"Dispatch_Directory_Reaper_Average_Time(ms)\" as \"Average Time to Reap Dispatch Directory (ms)\", \"Dispatch_Directory_Reaper_Max_Time(ms)\" as \"Max Time to Reap Dispatch Directory (ms)\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Peer Heartbeat",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=distributed_peer_heartbeat search_group=$role|h$ search_group=\"$group$\"\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat`\n              avg(get_auth_$peer_heartbeat_no_split_agg$_ms) as get_auth_$peer_heartbeat_no_split_agg$_ms\n              avg(get_bundleList_$peer_heartbeat_no_split_agg$_ms) as get_bundleList_$peer_heartbeat_no_split_agg$_ms\n              avg(get_serverInfo_$peer_heartbeat_no_split_agg$_ms) as get_serverInfo_$peer_heartbeat_no_split_agg$_ms\n            | eval get_auth_$peer_heartbeat_no_split_agg$_ms = round(get_auth_$peer_heartbeat_no_split_agg$_ms)\n            | eval get_bundleList_$peer_heartbeat_no_split_agg$_ms = round(get_bundleList_$peer_heartbeat_no_split_agg$_ms)\n            | eval get_serverInfo_$peer_heartbeat_no_split_agg$_ms = round(get_serverInfo_$peer_heartbeat_no_split_agg$_ms)\n            | rename get_auth_$peer_heartbeat_no_split_agg$_ms as \"Get Authentication\",\n                get_bundleList_$peer_heartbeat_no_split_agg$_ms as \"Get Bundle List\",\n                get_serverInfo_$peer_heartbeat_no_split_agg$_ms as \"Get Peer Info\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Peer Heartbeat",
        "query": "",
        "base": "",
        "text": "Authentication: the search head requests an authentication token from the peer's /services/admin/auth-tokens endpoint. \n        Get Bundle List: the search head requests a list of available knowledge bundles from the peer's /services/admin/bundles endpoint. \n        Get Peer Info: the search head requests instance information from the peer's /services/server/info endpoint.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Peer Heartbeat: Time to Get $peer_heartbeat_metric_label$",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=distributed_peer_heartbeat search_group=$role|h$ search_group=\"$group$\"\n            | where get_$peer_heartbeat_metric$_$peer_heartbeat_split_agg$_ms > $peer_heartbeat_metric_filter$\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` $peer_heartbeat_split_agg$(get_$peer_heartbeat_metric$_$peer_heartbeat_split_agg$_ms) as metric by host\n            | eval metric = round(metric)",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Peer Heartbeat: Time to Get $peer_heartbeat_metric_label$",
        "query": "",
        "base": "",
        "text": "Authentication: the search head requests an authentication token from the peer's /services/admin/auth-tokens endpoint. \n        Get Bundle List: the search head requests a list of available knowledge bundles from the peer's /services/admin/bundles endpoint. \n        Get Peer Info: the search head requests instance information from the peer's /services/server/info endpoint.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "fields _time, baseline_count, delta_count",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "eval baseline_size_mb = round(baseline_bytes / 1024 / 1024, 2)\n            | eval delta_size_mb = round(delta_bytes / 1024 / 1024, 2)\n            | fields _time, baseline_size_mb, delta_size_mb",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Size (MB)"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "eval baseline_sec_spent = round(baseline_msec_spent / 1000, 2)\n            | eval delta_sec_spent = round(delta_msec_spent / 1000, 2)\n            | fields _time, baseline_sec_spent, delta_sec_spent",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (sec)"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bundle $bundles_group_label$ Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=$bundles_group$ search_group=$role|h$ search_group=\"$group$\"\n            | `dmc_timechart_for_metrics_log` sum($bundle_rep_mode$_count) as count by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bundle $bundles_group_label$ Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=$bundles_group$ search_group=$role|h$ search_group=\"$group$\"\n            | eval $bundle_rep_mode$_mb = round($bundle_rep_mode$_bytes / 1024 / 1024, 2)\n            | `dmc_timechart_for_metrics_log` sum($bundle_rep_mode$_mb) as size by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Size (MB)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bundle $bundles_group_label$ Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=$bundles_group$ search_group=$role|h$ search_group=\"$group$\"\n            | eval $bundle_rep_mode$_sec_spent = round($bundle_rep_mode$_msec_spent / 1000, 2)\n            | `dmc_timechart_for_metrics_log` sum($bundle_rep_mode$_sec_spent) as msec_spent by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (sec)"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Total $bundles_group_label$ size is the sum of all bundles sent by all search heads to all search peers.\n        Total $bundles_group_label$ time is the sum of all time taken by all search heads to push bundles to all search peers.\n        Time spent is related to bundle size, larger bundles take more time to be replicated.\n        These panels account for the replication of both baseline (full bundle) and delta (incremental changes only) bundles.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Time to Reap",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=dispatch_directory_reaper search_group=$role|h$ search_group=\"$group$\"\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` avg(dispatch_dir_reaper_mean_ms) as dispatch_dir_reaper_mean_ms, max(dispatch_dir_reaper_max_ms) as dispatch_dir_reaper_max_ms\n            | eval dispatch_dir_reaper_mean_ms = round(dispatch_dir_reaper_mean_ms)\n            | eval dispatch_dir_reaper_max_ms = round(dispatch_dir_reaper_max_ms)\n            | rename dispatch_dir_reaper_mean_ms as Average, dispatch_dir_reaper_max_ms as Max",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Time to Reap",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=bundle_directory_reaper search_group=$role|h$ search_group=\"$group$\"\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` avg(bundle_dir_reaper_mean_ms) as bundle_dir_reaper_mean_ms, max(bundle_dir_reaper_max_ms) as bundle_dir_reaper_max_ms\n            | eval bundle_dir_reaper_mean_ms = round(bundle_dir_reaper_mean_ms)\n            | eval bundle_dir_reaper_max_ms = round(bundle_dir_reaper_max_ms)\n            | rename bundle_dir_reaper_mean_ms as Average, bundle_dir_reaper_max_ms as Max",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Time to Reap Directories",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=dispatch_directory_reaper search_group=$role|h$ search_group=\"$group$\"\n            | where dispatch_dir_reaper_$reaper_agg$_ms > $dispatch_dir_filter$\n            | eval dispatch_dir_reaper_$reaper_agg$_ms = round(dispatch_dir_reaper_$reaper_agg$_ms)\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` $reaper_agg$(dispatch_dir_reaper_$reaper_agg$_ms) as dispatch_dir_reaper_ms by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Time to Reap Directories",
        "query": "",
        "base": "",
        "text": "The dispatch reaper clears expired search artifacts from the dispatch directory. Learn More\n        Long reap times can indicate storage performance issues or an excessive number of artifacts.\n        The Average reap time is averaged across all instances in scope.\n        The Maximum reap time is the highest reap time across all instances in scope.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Time to Reap Directories",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=bundle_directory_reaper search_group=$role|h$ search_group=\"$group$\"\n            | where bundle_dir_reaper_$reaper_agg$_ms > $bundle_dir_filter$\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` $reaper_agg$(bundle_dir_reaper_$reaper_agg$_ms) as bundle_dir_reaper_$reaper_agg$_ms by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Time to Reap Directories",
        "query": "",
        "base": "",
        "text": "The knowledge bundle reaper clears expired knowledge bundles from a search peer's $SPLUNK_HOME/var/run/searchpeers directory.\n        Long reap times can indicate storage performance issues or an excessive number of bundles.\n        The Average reap time is averaged across all instances in scope.\n        The Maximum reap time is the highest reap time across all instances in scope.",
        "options": {}
      }
    ],
    "sourceSha256": "e505ce5f331c787698ce80409b1c01f5695896563db2910669f97578458b71fa"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "distributed_search_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "distributed_search_instance",
    "label": "Distributed Search: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers (Search Peers)"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "where status!=\"Up\"\n            | stats count as down_count, values(peerName) as peer_name",
        "base": "peers_base",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "down_count",
          "splunk_monitoring_console.KpiTrafficLight.detail": "peer_name",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"All peers are up.\", \"$down_count$ peers are down.\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "where health_status!=\"Healthy\"\n            | stats count as unhealthy_count, values(peerName) as peer_name",
        "base": "peers_base",
        "text": "",
        "options": {
          "height": "50",
          "splunk_monitoring_console.KpiTrafficLight.field": "unhealthy_count",
          "splunk_monitoring_console.KpiTrafficLight.detail": "peer_name",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"All peers are healthy.\", \"$unhealthy_count$ peers are unhealthy.\"]"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Peers ($peer_count$)",
        "query": "eval mem_gb = round(physicalMemoryMB / 1024, 2)\n            | eval disabled = if(disabled == 1, \"yes\", \"no\")\n            | `dmc_time_format(startup_time)`\n            | fields peerName, status, status_details, get_auth_max_ms, get_auth_mean_ms, get_bundleList_max_ms, get_bundleList_mean_ms, get_serverInfo_max_ms, get_serverInfo_mean_ms, health_status, health_check_failures, replicationStatus, startup_time, disabled\n            | rename peerName as Peer, status as Status, status_details as \"Status Details\", get_auth_max_ms as \"Authentication Max Time (ms)\", get_auth_mean_ms as \"Authentication Mean Time (ms)\", get_bundleList_max_ms as \"Get Bundle List Max Time (ms)\", get_bundleList_mean_ms as \"Get Bundle List Mean Time (ms)\", get_serverInfo_max_ms as \"Get Peer Info Max Time (ms)\", get_serverInfo_mean_ms as \"Get Peer Info Mean Time (ms)\", health_status as \"Health Condition\", health_check_failures as \"Health Details\", replicationStatus as \"Replication Status\", startup_time as \"Startup Time\", disabled as Disabled, version as Version, numberOfCores as \"CPU Cores\", mem_gb as \"Physical Memory (GB)\"",
        "base": "peers_base",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Peers ($peer_count$)",
        "query": "",
        "base": "",
        "text": "Health Condition indicates the overall status of the peer over the last 10 minutes.\n        Peer response times shown are computed over the last 10 minutes. Abnormally high response times (greater than 1000 ms) indicate peer oversubscription. Learn More\n        Authentication: the search head requests an authentication token from the peer's /services/admin/auth-tokens endpoint. \n        Get Bundle List: the search head requests a list of available knowledge bundles from the peer's /services/admin/bundles endpoint. \n        Get Peer Info: the search head requests instance information from the peer's /services/server/info endpoint.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Peer: $peer_drilldown$",
        "query": "search peerName = $peer_drilldown$\n            | fields - _timediff, peerName, status, status_details, get_auth_max_ms, get_auth_mean_ms, get_bundleList_max_ms, get_bundleList_mean_ms, get_serverInfo_max_ms, get_serverInfo_mean_ms, health_status, health_check_failures, replicationStatus, startup_time, disabled, server_roles, peerType, title, author, published, updated, remote_session, splunk_server, eai*\n            | transpose\n            | rename column as Property, \"row 1\" as Value",
        "base": "peers_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Peer: $peer_drilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Knowledge Bundle Replication (in last 10 minutes)",
        "query": "eval bundle_file_count = if(isNotNull(bundle_file_count), bundle_file_count, count)\n            | fields bundle_file_count",
        "base": "bundle_replication_api_base",
        "text": "",
        "options": {
          "underLabel": "Local Bundle Files",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Knowledge Bundle Replication (in last 10 minutes)",
        "query": "eval avg_mb = if(isNotNull(average_baseline_file_size), round(average_baseline_file_size /1024 / 1024, 2), \"Unknown\")\n            | fields avg_mb",
        "base": "bundle_replication_api_base",
        "text": "",
        "options": {
          "numberPrecision": "0.00",
          "afterLabel": "MB",
          "underLabel": "Average Size of Baseline Bundle File",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Knowledge Bundle Replication (in last 10 minutes)",
        "query": "eval avg_sec = average_msecs / 1000\n            | fields avg_sec",
        "base": "bundle_replication_api_base",
        "text": "",
        "options": {
          "numberPrecision": "0.00",
          "afterLabel": "sec",
          "underLabel": "Average Bundle Push Time",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Knowledge Bundle Replication (in last 10 minutes)",
        "query": "",
        "base": "",
        "text": "Average Bundle Push Time is the average time per bundle push to all search peers. This is not the average time spent to send one bundle.\n        Time spent is related to bundle size, larger bundles would take more time to be replicated.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "single",
        "title": "Time to Reap Knowledge Bundle Directory (in last 10 minutes)",
        "query": "fields \"Bundle_Directory_Reaper_Average_Time(ms)\"",
        "base": "bundle_directory_reaper_api_base",
        "text": "",
        "options": {
          "afterLabel": "ms",
          "underLabel": "Average",
          "height": "80px",
          "useColors": "true",
          "rangeValues": "[15000]",
          "rangeColors": "[\"0x5cc05c\",\"0xed8440\"]"
        }
      },
      {
        "row": 5,
        "kind": "single",
        "title": "Time to Reap Knowledge Bundle Directory (in last 10 minutes)",
        "query": "fields \"Bundle_Directory_Reaper_Max_Time(ms)\"",
        "base": "bundle_directory_reaper_api_base",
        "text": "",
        "options": {
          "afterLabel": "ms",
          "underLabel": "Max",
          "height": "80px",
          "useColors": "true",
          "rangeValues": "[25000]",
          "rangeColors": "[\"0x5cc05c\",\"0xed8440\"]"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Time to Reap Knowledge Bundle Directory (in last 10 minutes)",
        "query": "",
        "base": "",
        "text": "The knowledge bundle reaper clears expired knowledge bundles from a search peer's $SPLUNK_HOME/var/run/searchpeers directory.\n        Long reap times can indicate storage performance issues or an excessive number of bundles.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "single",
        "title": "Time to Reap Dispatch Directory (in last 10 minutes)",
        "query": "fields \"Dispatch_Directory_Reaper_Average_Time(ms)\"",
        "base": "dispatch_directory_reaper_api_base",
        "text": "",
        "options": {
          "afterLabel": "ms",
          "underLabel": "Average",
          "height": "80px",
          "useColors": "true",
          "rangeValues": "[15000]",
          "rangeColors": "[\"0x5cc05c\",\"0xed8440\"]"
        }
      },
      {
        "row": 5,
        "kind": "single",
        "title": "Time to Reap Dispatch Directory (in last 10 minutes)",
        "query": "fields \"Dispatch_Directory_Reaper_Max_Time(ms)\"",
        "base": "dispatch_directory_reaper_api_base",
        "text": "",
        "options": {
          "afterLabel": "ms",
          "underLabel": "Max",
          "height": "80px",
          "useColors": "true",
          "rangeValues": "[25000]",
          "rangeColors": "[\"0x5cc05c\",\"0xed8440\"]"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Time to Reap Dispatch Directory (in last 10 minutes)",
        "query": "",
        "base": "",
        "text": "The dispatch reaper clears expired search artifacts from the dispatch directory. Learn More\n        Long reap times can indicate storage performance issues or an excessive number of artifacts.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Peer Heartbeat",
        "query": "fields _time, get_auth_$peer_heartbeat_agg$_ms, get_bundleList_$peer_heartbeat_agg$_ms, get_serverInfo_$peer_heartbeat_agg$_ms\n            | rename get_auth_$peer_heartbeat_agg$_ms as \"Get Authentication\",\n                get_bundleList_$peer_heartbeat_agg$_ms as \"Get Bundle List\",\n                get_serverInfo_$peer_heartbeat_agg$_ms as \"Get Peer Info\"",
        "base": "peer_heartbeat_log_base",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Peer Heartbeat",
        "query": "",
        "base": "",
        "text": "Authentication: the search head requests an authentication token from the peer's /services/admin/auth-tokens endpoint. \n        Get Bundle List: the search head requests a list of available knowledge bundles from the peer's /services/admin/bundles endpoint. \n        Get Peer Info: the search head requests instance information from the peer's /services/server/info endpoint.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "fields _time, baseline_count, delta_count",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "eval baseline_size_mb = round(baseline_bytes / 1024 / 1024, 2)\n            | eval delta_size_mb = round(delta_bytes / 1024 / 1024, 2)\n            | fields _time, baseline_size_mb, delta_size_mb",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Size (MB)"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "eval baseline_sec_spent = round(baseline_msec_spent / 1000, 2)\n            | eval delta_sec_spent = round(delta_msec_spent / 1000, 2)\n            | fields _time, baseline_sec_spent, delta_sec_spent",
        "base": "bundle_rep_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (sec)"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Knowledge Bundle $bundles_group_label$ Activity",
        "query": "",
        "base": "",
        "text": "$bundles_group_label$ Size is the total size of bundle pushes to all search peers. This is not bundle size.\n        $bundles_group_label$ Time is the total time of bundle pushes to all search peers. This is not the time spent to send one bundle.\n        Time spent is related to bundle size, larger bundles take more time to be replicated.\n        These panels account for the replication of both baseline (full bundle) and delta (incremental changes only) bundles.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Time to Reap",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=dispatch_directory_reaper host=$host$\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` avg(dispatch_dir_reaper_mean_ms) as dispatch_dir_reaper_mean_ms, max(dispatch_dir_reaper_max_ms) as dispatch_dir_reaper_max_ms\n            | eval dispatch_dir_reaper_mean_ms = round(dispatch_dir_reaper_mean_ms)\n            | eval dispatch_dir_reaper_max_ms = round(dispatch_dir_reaper_max_ms)\n            | rename dispatch_dir_reaper_mean_ms as Average, dispatch_dir_reaper_max_ms as Max",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Time to Reap",
        "query": "",
        "base": "",
        "text": "The dispatch reaper clears expired search artifacts from the dispatch directory. Learn More\n        Long reap times can indicate storage performance issues or an excessive number of artifacts.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Time to Reap",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=search_health_metrics name=bundle_directory_reaper host=$host$\n            | `dmc_timechart_for_metrics_reaper_and_heartbeat` avg(bundle_dir_reaper_mean_ms) as bundle_dir_reaper_mean_ms, max(bundle_dir_reaper_max_ms) as bundle_dir_reaper_max_ms\n            | eval bundle_dir_reaper_mean_ms = round(bundle_dir_reaper_mean_ms)\n            | eval bundle_dir_reaper_max_ms = round(bundle_dir_reaper_max_ms)\n            | rename bundle_dir_reaper_mean_ms as Average, bundle_dir_reaper_max_ms as Max",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Time to Reap",
        "query": "",
        "base": "",
        "text": "The knowledge bundle reaper clears expired knowledge bundles from a search peer's $SPLUNK_HOME/var/run/searchpeers directory.\n        Long reap times can indicate storage performance issues or an excessive number of bundles.",
        "options": {}
      }
    ],
    "sourceSha256": "c395296ec86acad573dbf197f9e74787a28cfd99bf569c75769c5e3116d5839a"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_deployment.env_cloud",
    "label": "Forwarders: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Forwarder Monitoring is disabled. Go to the setup page to enable it.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Forwarders by $forwarderCountSplitByLabel$",
        "query": "",
        "base": "",
        "text": "Note: A forwarder is \"missing\" if it does not connect to indexers for 15 minutes. Forwarder status takes 30 minutes minimum to reflect a monitoring data collection interval of 15 minutes, and higher intervals can take longer.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "chart",
        "title": "Forwarders by $forwarderCountSplitByLabel$",
        "query": "stats dc(guid) as \"count\" by $forwarderCountSplitBy$",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "charting.chart": "pie"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Status and Configuration ($totalForwarderCount$) $last_run_time$",
        "query": "`dmc_time_format(last_connected)`\n| fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps\n| $forwarderNameFilter$\n| $forwarderStatusFilter$\n| rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Status and Configuration ($totalForwarderCount$) $last_run_time$",
        "query": "",
        "base": "",
        "text": "Click on a forwarder to see more details.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Total Count of Forwarders",
        "query": "fields count_forwarder",
        "base": "forwarderReceiverCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Forwarders"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Forwarder Outgoing Rate Over Time",
        "query": "`dmc_get_forwarder_tcpin` splunk_server=local\n| `dmc_timechart_for_metrics_log` avg($funcForwarderCountOverlay$) as $funcForwarderCountOverlay$\n| rename $funcForwarderCountOverlay$ as $forwarderCountOverlayLabel$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleY.text": "Average $forwarderCountOverlayLabel$",
          "charting.axisTitleX.text": "Time"
        }
      }
    ],
    "sourceSha256": "46b410ab91d77452daf703e1f7c95a27bc1873e25c08cada73833c6e085fcf5e"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_deployment",
    "label": "Forwarders: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "checkbox",
        "token": "show_instances_forwarding_logs",
        "label": "show_instances_forwarding_logs",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Show instances forwarding internal logs"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Forwarder Monitoring is disabled. Go to the setup page to enable it.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Forwarders by $forwarderCountSplitByLabel$",
        "query": "",
        "base": "",
        "text": "Note: A forwarder is \"missing\" if it does not connect to indexers for 15 minutes. Forwarder status takes 30 minutes minimum to reflect a monitoring data collection interval of 15 minutes, and higher intervals can take longer.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "chart",
        "title": "Forwarders by $forwarderCountSplitByLabel$",
        "query": "stats dc(guid) as \"count\" by $forwarderCountSplitBy$",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "charting.chart": "pie"
        }
      },
      {
        "row": 1,
        "kind": "chart",
        "title": "Forwarders by $forwarderCountSplitByLabel$",
        "query": "stats dc(guid) as \"count\" by $forwarderCountSplitBy$",
        "base": "loadForwarderExcludingInternalAssetsSearch",
        "text": "",
        "options": {
          "charting.chart": "pie"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Status and Configuration $last_run_time$",
        "query": "| fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps\n| $forwarderNameFilter$\n| $forwarderStatusFilter$\n| rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Status and Configuration $last_run_time$",
        "query": "search NOT [| inputlookup dmc_assets | dedup serverName | rename serverName as hostname | fields hostname]\n| fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps\n| $forwarderNameFilter$\n| $forwarderStatusFilter$\n| rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Status and Configuration $last_run_time$",
        "query": "",
        "base": "",
        "text": "Click on a forwarder to see more details.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Total Count of Forwarders and Receivers",
        "query": "fields count_forwarder",
        "base": "forwarderReceiverCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Forwarders"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Total Count of Forwarders and Receivers",
        "query": "fields count_forwarder",
        "base": "forwarderReceiverExcludingInternalCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Forwarders"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Total Count of Forwarders and Receivers",
        "query": "fields count_receiver",
        "base": "forwarderReceiverCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Receivers"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Total Count of Forwarders and Receivers",
        "query": "",
        "base": "",
        "text": "Note: \"Forwarder\" is the GUID. \"Receiver\" is \"serverName:port\" combination.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Forwarder Connection Count Over Time",
        "query": "`dmc_get_forwarder_tcpin`\n| eval connection = hostname.\":\".sourcePort.\"->\".host.\":\".destPort\n| eval event_count = tcp_eps * 30\n| `dmc_timechart_for_metrics_log` dc(connection) as connection_count, per_second($funcForwarderCountOverlay$) as $funcForwarderCountOverlay$\n| rename connection_count as \"Connections\", $funcForwarderCountOverlay$ as $forwarderCountOverlayLabel$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.chart.overlayFields": "$forwarderCountOverlayLabel$",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "Average $forwarderCountOverlayLabel$",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Forwarder Connection Count Over Time",
        "query": "",
        "base": "",
        "text": "Note: \"Forwarder connection count\" is the total number of connections between forwarders and receivers. For example, if a forwarder connects to three receivers, its count is three.",
        "options": {}
      }
    ],
    "sourceSha256": "1a5c4a2e5f28630d60967107b2f7e59b31817fc96b055ae6f6e5aa2cf00e8335"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_instance.env_cloud",
    "label": "Forwarders: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "hostname",
        "label": "Instance:",
        "default": "",
        "choices": []
      },
      {
        "type": "time",
        "token": "time",
        "label": "Time Range:",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Forwarder Monitoring is disabled. Please go to the setup page to enable it.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Status and Configuration",
        "query": "`dmc_get_forwarder_tcpin` splunk_server=local hostname=$hostname$\n| eval source_uri = hostname.\":\".sourcePort\n| eval dest_uri = host.\":\".destPort\n| eval connection = source_uri.\"->\".dest_uri\n| stats values(fwdType) as fwdType, values(sourceIp) as sourceIp, latest(version) as version,  values(os) as os, values(arch) as arch, dc(dest_uri) as dest_count, dc(connection) as connection_count, avg(tcp_KBps) as avg_tcp_kbps, avg(tcp_eps) as avg_tcp_eps by hostname, guid\n| eval avg_tcp_kbps = round(avg_tcp_kbps, 2)\n| eval avg_tcp_eps = round(avg_tcp_eps, 2)\n| `dmc_rename_forwarder_type(fwdType)`\n| rename hostname as Instance, fwdType as \"Forwarder Type\", sourceIp as IP, version as \"Splunk Version\", os as OS, arch as Architecture, guid as GUID, dest_count as \"Receiver Count\", connection_count as \"Connection Count\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Status and Configuration",
        "query": "",
        "base": "",
        "text": "Note: Multiple forwarders installed on one host appear with identical host names, but different GUIDs.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Outgoing Data Rate",
        "query": "`dmc_get_forwarder_tcpin` splunk_server=local hostname=$hostname$\n| `dmc_timechart_for_metrics_log` $funcVolume$(eval(tcp_KBps)) as \"KB/s\", $funcVolume$(tcp_eps) as \"Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY2.majorUnit": "auto",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.overlayFields": "Events/s",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY2.text": "Events/s",
          "charting.axisLabelsY.majorUnit": "auto",
          "charting.axisTitleY.text": "KB/s",
          "charting.axisTitleX.text": "Time"
        }
      }
    ],
    "sourceSha256": "982ebf0bca516068c9c0a2b891a341ef1970a2b543454872b471a83fb5458db1"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_instance",
    "label": "Forwarders: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "hostname",
        "label": "Instance:",
        "default": "",
        "choices": []
      },
      {
        "type": "time",
        "token": "time",
        "label": "Time Range:",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Forwarder Monitoring is disabled. Please go to the setup page to enable it.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Status and Configuration",
        "query": "`dmc_get_forwarder_tcpin` hostname=$hostname$\n| eval source_uri = hostname.\":\".sourcePort\n| eval dest_uri = host.\":\".destPort\n| eval connection = source_uri.\"->\".dest_uri\n| stats values(fwdType) as fwdType, values(sourceIp) as sourceIp, latest(version) as version,  values(os) as os, values(arch) as arch, dc(dest_uri) as dest_count, dc(connection) as connection_count, avg(tcp_KBps) as avg_tcp_kbps, avg(tcp_eps) as avg_tcp_eps by hostname, guid\n| eval avg_tcp_kbps = round(avg_tcp_kbps, 2)\n| eval avg_tcp_eps = round(avg_tcp_eps, 2)\n| `dmc_rename_forwarder_type(fwdType)`\n| rename hostname as Instance, fwdType as \"Forwarder Type\", sourceIp as IP, version as \"Splunk Version\", os as OS, arch as Architecture, guid as GUID, dest_count as \"Receiver Count\", connection_count as \"Connection Count\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Status and Configuration",
        "query": "",
        "base": "",
        "text": "Click on a forwarder to see a list of connected receivers.\n        Note: Multiple forwarders installed on one host appear with identical host names, but different GUIDs.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "List of Instances $forwarderStatusDrilldown$ Connects to",
        "query": "`dmc_get_forwarder_tcpin` hostname=$hostname$\n| eval dest_uri = host.\": \".destPort\n| stats count by dest_uri\n| fields dest_uri\n| rename dest_uri as \"Receivers\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "List of Instances $forwarderStatusDrilldown$ Connects to",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Outgoing Data Rate",
        "query": "`dmc_get_forwarder_tcpin` hostname=$hostname$\n| `dmc_timechart_for_metrics_log` $funcVolume$(eval(tcp_KBps)) as \"KB/s\", $funcVolume$(tcp_eps) as \"Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY2.majorUnit": "auto",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.overlayFields": "Events/s",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY2.text": "Events/s",
          "charting.axisLabelsY.majorUnit": "auto",
          "charting.axisTitleY.text": "KB/s",
          "charting.axisTitleX.text": "Time"
        }
      }
    ],
    "sourceSha256": "40fa3534405574423f6fe6f683694b2c8ea25e45240067a902f7c5f8c2660e63"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_overview.prod_lite",
    "label": "Forwarder Monitoring",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Note: A forwarder is \"missing\" if it does not connect to indexers for 15 minutes. Forwarder status takes 30 minutes minimum to reflect a monitoring data collection interval of 15 minutes, and higher intervals can take longer.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Total Count of Forwarders",
        "query": "fields count_forwarder",
        "base": "forwarderReceiverCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Count of Missing Forwarders",
        "query": "fields count_forwarder",
        "base": "forwarderMissingCountBaseSearch",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Outgoing Data Rate - All Forwarders",
        "query": "`dmc_get_forwarder_tcpin` | `dmc_timechart_for_metrics_log` avg(eval(tcp_KBps)) as \"KB/s\", avg(tcp_eps) as \"Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisY2.enabled": "true",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.stackMode": "default",
          "charting.drilldown": "all",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.chart.overlayFields": "Events/s",
          "charting.axisTitleY.text": "KB/s",
          "charting.axisTitleY2.text": "Events/s",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Forwarder Status",
        "query": "`dmc_time_format(last_connected)`\n| fields hostname, guid, version, os, arch, status, last_connected, avg_tcp_kbps\n| $forwarderStatusFilter$\n| $forwarderNameFilter$\n| rename hostname as \"Instance Name\", guid as \"GUID\", version as \"Version\", os as \"OS\", arch as \"CPU Architecture\", status as \"Status\", last_connected as \"Last Connected\", avg_tcp_kbps as \"Average KB/s\"",
        "base": "loadForwarderAssetsSearch",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Outgoing Data Rate - $hostname$",
        "query": "`dmc_get_forwarder_tcpin` hostname=$hostname$\n| `dmc_timechart_for_metrics_log` avg(eval(tcp_KBps)) as \"KB/s\", avg(tcp_eps) as \"Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsY2.majorUnit": "auto",
          "charting.axisY2.enabled": "true",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.overlayFields": "Events/s",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY2.text": "Events/s",
          "charting.axisLabelsY.majorUnit": "auto",
          "charting.axisTitleY.text": "KB/s",
          "charting.axisTitleX.text": "Time"
        }
      }
    ],
    "sourceSha256": "92209eef28813774a75579eeea9b37dcc67ca133fbe5fdf0d594b2f8d18eea96"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "forwarder_overview",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "http_event_collector_deployment",
    "label": "HTTP Event Collector: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "role",
        "label": "Role",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexer"
          },
          {
            "value": "dmc_group_search_head",
            "label": "Search Head"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "token_name",
        "label": "Token",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Tokens"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n        \n          All\n          Snapshot\n          Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Requests",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(events_total) as events_total by _time\n          | stats latest(events_total) as event_latest \n          | eval event_throughput = event_latest/60 \n          | fields event_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Events Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(valid_requests_total) as valid_requests_total by _time\n          | stats latest(valid_requests_total) as valid_request_latest \n          | eval valid_requests_throughput=valid_request_latest/60 \n          | fields valid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Valid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(invalid_requests_total) as invalid_requests_total by _time\n          | stats latest(invalid_requests_total) as invalid_request_latest \n          | eval invalid_requests_throughput=invalid_request_latest/60 \n          | fields invalid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Data",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_received) as data_received_latest \n          | eval data_received_throughput = round(data_received_latest/60, 3) \n          | fields data_received_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Received (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_indexed) as data_indexed_latest \n          | eval data_indexed_throughput = round(data_indexed_latest/60, 3) \n          | fields data_indexed_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Indexed (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Invalid requests consist of authentication failures, requests to a disabled token, and requests to an incorrect URL.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Activity (Last 30 Minutes)",
        "query": "timechart minspan=\"1m\" sum(valid_requests_total) as \"Valid Requests\" sum(invalid_requests_total) as \"Invalid Requests\" sum(data_received) as \"Data Received\"",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.overlayFields": "\"Data Received\"",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.fields": "\"Data Received\"",
          "charting.axisTitleY2.text": "Data Received (MB)",
          "charting.axisY2.scale": "linear",
          "charting.axisTitleX.text": "Time",
          "charting.lineDashStyle": "solid",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Count of Requests",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Instances",
        "query": "| rest splunk_server_group=\"$group$\" /services/data/inputs/http \n          | search title=\"http://$token_name$\" \n          | dedup splunk_server                          \n          | fields splunk_server                          \n          | join type=left splunk_server [|`dmc_get_instance_roles` | rename serverName as splunk_server]                                              \n          | fields host, splunk_server, role                          \n          | join type=left splunk_server [| rest /services/server/status/resource-usage/hostwide\n          | eval mem_used=round(mem_used / mem * 100, 0)  \n          | eval cpu_usage=cpu_system_pct + cpu_user_pct\n          | fields splunk_server, mem_used, cpu_usage]\n          | eval port = if(isnotnull(port), port, 8088)                                 \n          | fields host, cpu_usage, mem_used, role, port\n          | rename host as \"Instance\", cpu_usage as \"CPU Usage (%)\", mem_used as \"Memory Usage (%)\", role as Role, port as \"HTTP Event Collector Port Number\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval events_total = if(event_count==0, 0, events_total)\n          | fields events_total\n          | rename events_total as \"Event Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Event Count",
          "height": "80px"
        }
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval valid_requests_total = if(event_count==0, 0, valid_requests_total)\n          | fields valid_requests_total\n          | rename valid_requests_total as \"Valid Request Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Valid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval invalid_requests_total = if(event_count==0, 0, invalid_requests_total)\n          | fields invalid_requests_total\n          | rename invalid_requests_total as \"Invalid Request Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Request Overview",
        "query": "",
        "base": "",
        "text": "The invalid request count for this token does not include invalid requests due to authentication failures or requests to an incorrect URL because those errors are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_received = if(event_count==0, 0, data_received)\n          | fields data_received\n          | rename data_received as \"Data Received\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "MB Received",
          "height": "80px"
        }
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_indexed = if(event_count==0, 0, data_indexed)\n          | fields data_indexed\n          | rename data_indexed as \"Data Indexed\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "MB Indexed",
          "height": "80px"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"http_event_collector_token\" $token_clause$      \n          | bin _time minspan=1m                     \n          | stats sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, values(data.token_name) as token_name by _time\n          | eval valid_requests_total = requests_total\n          | timechart partial=f minspan=1m sum($event_type$) as $event_type$ by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, num_of_auth_failures, num_of_requests_to_disabled_token, num_of_requests_to_incorrect_url, num_of_parser_errors\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, num_of_requests_to_disabled_token, num_of_parser_errors\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"http_event_collector_token\" $token_clause$\n          | bin _time minspan=1m\n          | timechart partial=f minspan=1m sum(data.$invalid_request_reason$) as $invalid_request_reason$ by data.token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "Errors due to authentication failure or requests to an incorrect URL are excluded from this chart because they are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"http_event_collector_token\"\n          | bin _time minspan=1m \n          | stats sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received, values(data.token_name) as token_name by _time\n          | eval data_received=data_received/pow(1024, 2)\n          | eval data_indexed=data_indexed/pow(1024, 2)\n          | timechart partial=f minspan=1m sum($data_type$) by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 12,
        "kind": "table",
        "title": "Instances Overview",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" search_group=$role$ search_group=\"$group$\" data.series=\"$data_series$\" $token_clause$\n          | bin _time minspan=1m \n          | stats sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_requests_to_disabled_token) as disabled_token_total, sum(data.num_of_requests_to_incorrect_url) as incorrect_url_total, sum(data.num_of_auth_failures) as auth_fail_total, sum(data.num_of_errors) as error_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received by _time, host\n          | join host [ \n          | inputlookup dmc_assets \n          | mvcombine search_group \n          | search search_group=$role$ OR search_group=\"$group$\" ]\n          | eval incorrect_url_total=if(isnull(incorrect_url_total), 0, incorrect_url_total) \n          | eval auth_fail_total=if(isnull(auth_fail_total), 0, auth_fail_total)\n          | eval data_indexed=round(data_indexed/pow(1024, 2), 2)\n          | eval data_received=round(data_received/pow(1024, 2), 2)\n          | eval valid_requests_total = requests_total\n          | eval invalid_requests_total = disabled_token_total + incorrect_url_total + auth_fail_total\n          | stats sum(events_total) as events_total, sum(valid_requests_total) as valid_requests_total, sum(invalid_requests_total) as invalid_requests_total, sum(data_received) as data_received, sum(data_indexed) as data_indexed by host\n          | fields host, events_total, valid_requests_total, invalid_requests_total, data_received, data_indexed\n          | rename host as Instance, events_total as \"Event Count\", valid_requests_total as \"Valid Request Count\", invalid_requests_total as \"Invalid Request Count\", data_received as \"Data Received (MB)\", data_indexed as \"Data Indexed (MB)\"",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "c3ec888a491715ba08f31dc48269da5f6999e47e6827e112a088723e9b8368ae"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "http_event_collector_instance.env_cloud",
    "label": "HTTP Event Collector",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "token_name",
        "label": "Token",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Tokens"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Requests",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(events_total) as events_total by _time\n            | stats latest(events_total) as event_latest\n            | eval event_throughput = event_latest/60\n            | fields event_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Events Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(valid_requests_total) as valid_requests_total by _time\n            | stats latest(valid_requests_total) as valid_request_latest\n            | eval valid_requests_throughput=valid_request_latest/60\n            | fields valid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Valid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats sum(invalid_requests_total) as invalid_requests_total by _time\n            | stats latest(invalid_requests_total) as invalid_request_latest\n            | eval invalid_requests_throughput=invalid_request_latest/60\n            | fields invalid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Data",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_received) as data_received_latest\n            | eval data_received_throughput = round(data_received_latest/60, 3)\n            | fields data_received_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Received (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_indexed) as data_indexed_latest\n            | eval data_indexed_throughput = round(data_indexed_latest/60, 3)\n            | fields data_indexed_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Indexed (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Invalid requests consist of authentication failures, requests to a disabled token, and requests to an incorrect URL.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Activity (Last 30 Minutes)",
        "query": "timechart minspan=\"1m\" sum(valid_requests_total) as \"Valid Requests\" sum(invalid_requests_total) as \"Invalid Requests\" sum(data_received) as \"Data Received\"",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.overlayFields": "\"Data Received\"",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.fields": "\"Data Received\"",
          "charting.axisTitleY2.text": "Data Received (MB)",
          "charting.axisY2.scale": "linear",
          "charting.axisTitleX.text": "Time",
          "charting.lineDashStyle": "solid",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Count of Requests",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval events_total = if(event_count==0, 0, events_total)\n            | fields events_total\n            | rename events_total as \"Event Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Event Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval valid_requests_total = if(event_count==0, 0, valid_requests_total)\n            | fields valid_requests_total\n            | rename valid_requests_total as \"Valid Request Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Valid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval invalid_requests_total = if(event_count==0, 0, invalid_requests_total)\n            | fields invalid_requests_total\n            | rename invalid_requests_total as \"Invalid Request Count\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Request Overview",
        "query": "",
        "base": "",
        "text": "The invalid request count for this token does not include invalid requests due to authentication failures or requests to an incorrect URL because those errors are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_received = if(event_count==0, 0, data_received)\n            | fields data_received\n            | rename data_received as \"Data Received\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "MB Received",
          "height": "80px"
        }
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_indexed = if(event_count==0, 0, data_indexed)\n            | fields data_indexed\n            | rename data_indexed as \"Data Indexed\"",
        "base": "base_historical_search",
        "text": "",
        "options": {
          "underLabel": "MB Indexed",
          "height": "80px"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $event_type$\n            | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $event_type$\n            | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $event_type$\n            | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"http_event_collector_token\" $token_clause$\n            | bin _time minspan=1m\n            | stats sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, values(data.token_name) as token_name by _time\n            | eval valid_requests_total = requests_total\n            | timechart partial=f minspan=1m sum($event_type$) as $event_type$ by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n            | fields _time, num_of_auth_failures, num_of_requests_to_disabled_token, num_of_requests_to_incorrect_url, num_of_parser_errors\n            | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n            | fields _time, num_of_requests_to_disabled_token, num_of_parser_errors\n            | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n            | fields _time, $invalid_request_reason$\n            | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n            | fields _time, $invalid_request_reason$\n            | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n            | fields _time, $invalid_request_reason$\n            | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"http_event_collector_token\" $token_clause$\n            | bin _time minspan=1m\n            | timechart partial=f minspan=1m sum(data.$invalid_request_reason$) as $invalid_request_reason$ by data.token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "Errors due to authentication failure or requests to an incorrect URL are excluded from this chart because they are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $data_type$\n            | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $data_type$\n            | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"$data_series$\" $token_clause$\n            | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | eval valid_requests_total = requests_total\n            | fields _time, $data_type$\n            | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" data.series=\"http_event_collector_token\"\n            | bin _time minspan=1m\n            | stats sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received, values(data.token_name) as token_name by _time\n            | eval data_received=data_received/pow(1024, 2)\n            | eval data_indexed=data_indexed/pow(1024, 2)\n            | timechart partial=f minspan=1m sum($data_type$) by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      }
    ],
    "sourceSha256": "80e295f724baf9a10cec4cf109265e0de8d862e0f1358948f25e482d1110afc8"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "http_event_collector_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "http_event_collector_instance",
    "label": "HTTP Event Collector: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "host",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "token_name",
        "label": "Token",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Tokens"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n        \n          All\n          Snapshot\n          Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Requests",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(events_total) as event_latest\n          | eval event_throughput = event_latest/60\n          | fields event_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Events Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(valid_requests_total) as valid_request_latest\n          | eval valid_requests_throughput=valid_request_latest/60\n          | fields valid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Valid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(invalid_requests_total) as invalid_request_latest\n          | eval invalid_requests_throughput=invalid_request_latest/60\n          | fields invalid_requests_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Requests Per Second",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Data",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_received) as data_received_latest\n          | eval data_received_throughput = round(data_received_latest/60, 3)\n          | fields data_received_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Received (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Current Throughput",
        "query": "stats latest(data_indexed) as data_indexed_latest\n          | eval data_indexed_throughput = round('data_indexed_latest'/60, 3)\n          | fields data_indexed_throughput",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "underLabel": "Data Indexed (MB) Per Second",
          "numberPrecision": "0.000",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Current Throughput",
        "query": "",
        "base": "",
        "text": "Invalid requests consist of authentication failures, requests to a disabled token, and requests to an incorrect URL.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Past 30 Minutes",
        "query": "timechart minspan=\"1m\" sum(valid_requests_total) as valid_requests_total, sum(invalid_requests_total) as invalid_requests_total, sum(data_received) as data_received\n          | rename valid_requests_total as \"Valid Requests\", invalid_requests_total as \"Invalid Requests\", data_received as \"Data Received\"",
        "base": "base_snapshot_search",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.overlayFields": "\"Data Received\"",
          "charting.axisTitleY2.text": "Data Received (MB)",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.fields": "\"Data Received\"",
          "charting.axisY2.scale": "linear",
          "charting.lineDashStyle": "solid",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Count of Requests",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval events_total = if(event_count==0, 0, events_total)\n          | fields events_total",
        "base": "base_host_search",
        "text": "",
        "options": {
          "underLabel": "Event Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval valid_request_count_total = if(event_count==0, 0, requests_total)\n          | fields valid_request_count_total",
        "base": "base_host_search",
        "text": "",
        "options": {
          "underLabel": "Valid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Request Overview",
        "query": "eval invalid_request_count_total = if(event_count==0, 0, auth_failures_total + requests_to_disabled_token_total + requests_to_incorrect_url_total)\n          | fields invalid_request_count_total",
        "base": "base_host_search",
        "text": "",
        "options": {
          "underLabel": "Invalid Request Count",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Request Overview",
        "query": "",
        "base": "",
        "text": "The invalid request count for this token does not include invalid requests due to authentication failures or requests to an incorrect URL because those errors are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_received = if(event_count==0, 0, data_received)\n          | fields data_received",
        "base": "base_host_search",
        "text": "",
        "options": {
          "underLabel": "MB Received",
          "height": "80px"
        }
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Data Overview",
        "query": "eval data_indexed = if(event_count==0, 0, data_indexed)\n          | fields data_indexed",
        "base": "base_host_search",
        "text": "",
        "options": {
          "underLabel": "MB Indexed",
          "height": "80px"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $event_type$\n          | rename events_total as \"Events\", valid_requests_total as \"Valid Requests\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$activity_chart_label$ Count",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"http_event_collector_token\" $token_clause$      \n          | bin _time minspan=1m                     \n          | stats sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, values(data.token_name) as token_name by _time\n          | eval valid_requests_total = requests_total\n          | timechart partial=f minspan=1m sum($event_type$) as $event_type$ by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, num_of_auth_failures, num_of_requests_to_disabled_token, num_of_requests_to_incorrect_url, num_of_parser_errors\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, num_of_requests_to_disabled_token, num_of_parser_errors\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_auth_failures) as num_of_auth_failures, sum(data.num_of_requests_to_disabled_token) as num_of_requests_to_disabled_token, sum(data.num_of_requests_to_incorrect_url) as num_of_requests_to_incorrect_url, sum(data.num_of_parser_errors) as num_of_parser_errors\n          | fields _time, $invalid_request_reason$\n          | rename num_of_auth_failures as \"Authentication Failures\", num_of_requests_to_disabled_token as \"Requests to Disabled Token\", num_of_requests_to_incorrect_url as \"Requests to Incorrect URL\", num_of_parser_errors as \"Parser Errors\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Errors",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"http_event_collector_token\" $token_clause$ \n          | bin _time minspan=1m\n          | timechart partial=f minspan=1m sum(data.$invalid_request_reason$) as $invalid_request_reason$ by data.token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "Errors due to authentication failure or requests to an incorrect URL are excluded from this chart because they are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "There are no results for the selected reason because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because authentication failures are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Errors",
        "query": "",
        "base": "",
        "text": "The split by token option for this reason is disabled because requests to an incorrect url are not associated with any specific token.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"$data_series$\" $token_clause$ \n          | timechart partial=f minspan=1m sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_error_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as auth_failures_total, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url_total, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received\n          | eval data_received=data_received/pow(1024, 2) \n          | eval data_indexed=data_indexed/pow(1024, 2) \n          | eval valid_requests_total = requests_total\n          | fields _time, $data_type$\n          | rename data_received as \"Data Received\", data_indexed as \"Data Indexed\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Data $data_ingested_label$",
        "query": "`dmc_set_index_introspection` component=\"HttpEventCollector\" host=$host$ data.series=\"http_event_collector_token\"\n          | bin _time minspan=1m \n          | stats sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received, values(data.token_name) as token_name by _time\n          | eval data_received=data_received/pow(1024, 2)\n          | eval data_indexed=data_indexed/pow(1024, 2)\n          | timechart partial=f minspan=1m sum($data_type$) by token_name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleX.text": "Time",
          "charting.legend.placement": "bottom",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.nullValueMode": "zero"
        }
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Tokens ($token_count$)",
        "query": "| rest splunk_server=$splunk_server$ /services/data/inputs/http\n          | eval enabled = if(disabled == 1, \"No\", \"Yes\")\n          | eval Token=substr(title, 8)\n          | fields Token, enabled\n          | join type=\"left\" Token [search http_event_collector_token `dmc_set_index_introspection` host=$host$\n          | stats sum(data.num_of_events) as events_total, sum(data.num_of_requests) as requests_total, sum(data.num_of_parser_errors) as parser_errors_total, sum(data.num_of_requests_to_disabled_token) as requests_to_disabled_token_total, sum(data.num_of_auth_failures) as requests_with_auth_failures, sum(data.num_of_requests_to_incorrect_url) as requests_to_incorrect_url, sum(data.total_bytes_indexed) as data_indexed, sum(data.total_bytes_received) as data_received by data.token_name\n          | eval data_indexed=data_indexed/pow(1024, 2)\n          | eval data_received=data_received/pow(1024, 2)\n          | rename \"Data Indexed\" as \"Data Indexed (MB)\" \"Data Received\" as \"Data Received (MB)\"\n          | eval valid_requests_total = requests_total\n          | eval invalid_request_count_total = requests_to_disabled_token_total + requests_with_auth_failures + requests_to_incorrect_url\n          | fields data.token_name, events_total, valid_requests_total, invalid_request_count_total, data_received, data_indexed\n          | rename data.token_name as \"Token\"]\n          | eval events_total=if(isnull(events_total), 0, events_total)\n          | eval invalid_request_count_total=if(isnull(invalid_request_count_total), 0, invalid_request_count_total)\n          | eval valid_requests_total=if(isnull(valid_requests_total), 0, valid_requests_total)\n          | eval data_received=if(isnull(data_received), 0, data_received)\n          | eval data_indexed=if(isnull(data_indexed), 0, data_indexed)\n          | fields Token, enabled, data_indexed, data_received, events_total, invalid_request_count_total, valid_requests_total\n          | rename enabled as \"Enabled\", data_indexed as \"Data Indexed (MB)\", data_received as \"Data Received (MB)\", events_total as \"Event Count\", invalid_request_count_total as \"Invalid Request Count\", valid_requests_total as \"Valid Request Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      }
    ],
    "sourceSha256": "b35a8aaa1787405edfc52f4c8555650d9b9a83d9ea9ae3efcb500253f2f83cbb"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "index_detail_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "index_detail_deployment",
    "label": "Index Detail: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "datatype",
        "label": "Index Type",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Event Indexes Only"
          },
          {
            "value": "datatype=all",
            "label": "All Index Types *"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "index",
        "label": "Index",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n                    \n                        All\n                        Snapshot\n                        Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Index Structure Overview",
        "query": "stats dc(splunk_server) as instances",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Indexers",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Index Structure Overview",
        "query": "stats sum(indexSizeGB) as totalIndexSizeGB\n                        | eval totalIndexSizeGB = totalIndexSizeGB.\" GB\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Total Index Size",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Index Structure Overview",
        "query": "search title=$index$\n                        | stats sum(eval(total_raw_size / 1024)) as totalRawSizeGB\n                        | eval totalRawSizeGB = round(totalRawSizeGB, 2).\" GB\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Total Raw Data Size (Uncompressed)",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Index Structure Overview",
        "query": "stats sum(indexSizeGB) as totalIndexSizeGB\n                        sum(eval(total_raw_size / 1024)) as totalRawSizeGB\n                        | eval compressionRatio = round(totalRawSizeGB / totalIndexSizeGB, 2).\":1\"\n                        | fields compressionRatio\n                        | eval compressionRatio = if(isnotnull(compressionRatio), compressionRatio, \"N/A\")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Raw to Index Size Ratio*",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Index Structure Overview",
        "query": "",
        "base": "",
        "text": "* This is the ratio of uncompressed raw data size to index size.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events Overview",
        "query": "stats sum(eventCount) as totalEventCount\n                        | eval totalEventCount = toString(totalEventCount, \"commas\")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Total Events",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events Overview",
        "query": "stats min(minTime) as oldestEvent\n                        | eval oldestEvent = replace(oldestEvent, \"T\", \" \")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Earliest Event",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events Overview",
        "query": "stats max(maxTime) as newestEvent\n                        | eval newestEvent = replace(newestEvent, \"T\", \" \")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Latest Event",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Indexer Averages",
        "query": "stats avg(indexSizeGB) as avgIndexSizeGB\n                        | eval avgIndexSizeGB = round(avgIndexSizeGB, 2).\" GB\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Average Index Size",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Indexer Averages",
        "query": "stats avg(eventCount) as avgEventCount\n                        | eval avgEventCount = toString(floor(avgEventCount), \"commas\")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Average Event Count",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Indexer Averages",
        "query": "eval dataAgeDays = if(isnotnull(dataAgeDays), dataAgeDays, 0)\n                        | stats median(dataAgeDays) as medianDataAge\n                        | eval medianDataAge = medianDataAge.\" days\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Median Data Age",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Indexer Averages",
        "query": "stats avg(bucketCount) as avgBucketCount\n                        | eval avgBucketCount = floor(avgBucketCount)",
        "base": "index_base_search",
        "text": "",
        "options": {
          "underLabel": "Average Bucket Count",
          "height": "80px"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Instances ($indexCount$)",
        "query": "eval avgBucketSize = round(indexSizeGB / bucketCount, 2)\n                        | fields splunk_server, freezeRatioDays, indexSizeUsageGB, homeBucketUsageGB, coldBucketUsageGB, eventCount, bucketCount, avgBucketSize\n                        | rename splunk_server as \"Indexer\"\n                        freezeRatioDays as \"Data Age vs Frozen Age (days)\"\n                        indexSizeUsageGB as \"Index Usage (GB)\"\n                        homeBucketUsageGB as \"Home Path Usage (GB)\"\n                        coldBucketUsageGB as \"Cold Path Usage (GB)\"\n                        eventCount as \"Total Event Count\"\n                        bucketCount as \"Total Bucket Count\"\n                        avgBucketSize as \"Average Bucket Size (GB)\"",
        "base": "index_base_search",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances ($indexCount$)",
        "query": "",
        "base": "",
        "text": "The columns use attributes specified in indexes.conf:\n                \n                    Data Age vs Frozen Age: The first value is based on the age of the oldest event in the index. The second value is derived from the attribute frozenTimePeriodInSecs.\n                    Index Usage: The first value is the current size of the index. The second value is the index capacity, as specified  in maxTotalDataSizeMB.\n                    Home Path Usage: The first value is the current size of the home path portion of the index. The second value is the home path capacity, as specified in homePath.maxDataSizeMB.\n                    Cold Path Usage: The first value is the current size of the cold path portion of the index. The second value is the cold path capacity, as specified in coldPath.maxDataSizeMB.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Event Count by Hosts ($hostCount$)",
        "query": "| metadata type=hosts index=$index$ splunk_server_group=dmc_group_indexer splunk_server_group=\"$group$\"\n                        | fields host, totalCount\n                        | sort - totalCount\n                        | rename host as Host, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Event Count by Sources ($sourceCount$)",
        "query": "| metadata type=sources index=$index$ splunk_server_group=dmc_group_indexer splunk_server_group=\"$group$\"\n                        | fields source, totalCount\n                        | sort - totalCount\n                        | rename source as Source, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Event Count by Sourcetypes ($sourcetypeCount$)",
        "query": "| metadata type=sourcetypes index=$index$ splunk_server_group=dmc_group_indexer splunk_server_group=\"$group$\"\n                        | fields sourcetype, totalCount\n                        | sort - totalCount\n                        | rename sourcetype as Sourcetype, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$IndexUsageChartTitle$ Index Size (GB)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Indexes data.name=$index$ search_group=dmc_group_indexer search_group=\"$group$\"\n                        | `dmc_set_bin_for_disk_usage`\n                        | stats latest(data.total_size) as totalSize by host _time\n                        | `dmc_timechart_for_disk_usage` $funcDiskSizeUsage$(eval(totalSize /1024)) as \"Index Size\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "GB",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Instances by $PercentIndexUsageChartTitle$ Index Usage (%)",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 9,
        "kind": "viz",
        "title": "Instances by $PercentIndexUsageChartTitle$ Index Usage (%)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Indexes data.name=$index$ search_group=dmc_group_indexer search_group=\"$group$\"\n                        | eval pctDiskUsage = 'data.total_size' / 'data.total_capacity'\n                        | bin _time minspan=10min\n                        | stats $funcDiskPercUsage$(pctDiskUsage) as pctDiskUsage by host _time\n                        | rangemap field=pctDiskUsage \"0-25%\"=0-0.25 \"25-50%\"=0.2501-0.5 \"50-75%\"=0.5001-0.75 \"75-100%\"=0.7501-1 default=abnormal\n                        | `dmc_timechart_for_disk_usage` partial=f dc(host) as host by range\n                        | fields _time, \"0-25%\", \"25-50%\", \"50-75%\", \"75-100%\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Instances by $PercentIndexUsageChartTitle$ Index Usage (%)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Indexes data.name=$index$ search_group=dmc_group_indexer search_group=\"$group$\"\n                        | eval pctDiskUsage = 'data.total_size' / 'data.total_capacity'\n                        | bin _time minspan=10min\n                        | stats $funcDiskPercUsage$(pctDiskUsage) as pctDiskUsage by host _time\n                        | rangemap field=pctDiskUsage \"0-25%\"=0-0.25 \"25-50%\"=0.2501-0.5 \"50-75%\"=0.5001-0.75 \"75-100%\"=0.7501-1 default=abnormal\n                        | `dmc_timechart_for_disk_usage` partial=f dc(host) as host by range\n                        | fields _time, \"0-25%\", \"25-50%\", \"50-75%\", \"75-100%\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Instances by $PercentIndexUsageChartTitle$ Index Usage (%)",
        "query": "",
        "base": "",
        "text": "Note: An indexer on which the maximum data size of the index is infinite will not be represented here.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "$DataAgeChartTitle$ Data Age",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Indexes data.name=$index$ search_group=dmc_group_indexer search_group=\"$group$\"\n                        | eval data_birth_date = if(isnotnull('data.bucket_dirs.cold.event_min_time'), 'data.bucket_dirs.cold.event_min_time', 'data.bucket_dirs.home.event_min_time')\n                        | eval data_age_days = round((_time - data_birth_date) / 86400, 0)\n                        | `dmc_timechart_for_disk_usage` $funcDataAge$(data_age_days) as \"Data Age\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Data Age (days)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      }
    ],
    "sourceSha256": "c6b24685a15cc7b1fdfca67e6f862f61d33439881d0fe21b1aaf5875cddf0731"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "index_detail_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "index_detail_instance",
    "label": "Index Detail: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "datatype",
        "label": "Index Type",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Event Indexes Only"
          },
          {
            "value": "datatype=all",
            "label": "All Index Types *"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "single_index_name",
        "label": "Index",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "search title=$single_index_name$ | fields currentDBSizeGB | eval currentDBSizeGB = currentDBSizeGB.\" GB\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Index Size",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "search title=$single_index_name$ | fields total_raw_size_gb | eval total_raw_size_gb = total_raw_size_gb.\" GB\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Uncompressed Raw Data Size",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "search title=$single_index_name$ | fields compress_ratio",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Raw to Index Size Ratio*",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Overview",
        "query": "",
        "base": "",
        "text": "* This is the ratio of uncompressed raw data size to index size.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "search title=$single_index_name$ | fields total_bucket_count",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Bucket Count",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "search title=$single_index_name$ | fields avg_bucket_size_gb | eval avg_bucket_size_gb = avg_bucket_size_gb.\" GB\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Average Bucket Size",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "search title=$single_index_name$ | fields totalEventCount",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Event Count",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "search title=$single_index_name$ | fields minTime | eval minTime = replace(minTime, \"T\", \" \")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Earliest Event",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "search title=$single_index_name$ | fields maxTime | eval maxTime = replace(maxTime, \"T\", \" \")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Latest Event",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Status",
        "query": "search title=$single_index_name$\n| fields freeze_period_viz_day, disk_usage_gb, home_bucket_usage_gb, cold_bucket_usage_gb\n| rename freeze_period_viz_day as \"Data Age vs Frozen Age (days)\", disk_usage_gb as \"Index Usage (GB)\", home_bucket_usage_gb as \"Home Path Usage (GB)\", cold_bucket_usage_gb as \"Cold Path Usage (GB)\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Status",
        "query": "",
        "base": "",
        "text": "The columns use attributes specified in indexes.conf:\n        \n          Data Age vs Frozen Age: The first value is based on the age of the oldest event in the index. The second value is derived from the attribute frozenTimePeriodInSecs.\n          Index Usage: The first value is the current size of the index. The second value is the index capacity, as specified  in maxTotalDataSizeMB.\n          Home Path Usage: The first value is the current size of the home path portion of the index. The second value is the home path capacity, as specified in homePath.maxDataSizeMB.\n          Cold Path Usage: The first value is the current size of the cold path portion of the index. The second value is the cold path capacity, as specified in coldPath.maxDataSizeMB.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Volumes",
        "query": "| rest splunk_server=$splunk_server$ /services/data/indexes/$single_index_name$\n            | `dmc_exclude_indexes`\n            | rex field=homePath \"volume:(?<home_vol_name>[^/\\\\\\]*)(?:/|\\\\\\)\"\n            | rex field=coldPath \"volume:(?<cold_vol_name>[^/\\\\\\]*)(?:/|\\\\\\)\"\n            | fields home_vol_name cold_vol_name\n            | eval home_vol_name = if(isnull(home_vol_name), \"N/A\", home_vol_name)\n            | eval cold_vol_name = if(isnull(cold_vol_name), \"N/A\", cold_vol_name)\n            | rename home_vol_name as \"home\" cold_vol_name as \"cold\"\n            | transpose | rename column as \"Index Directory\" \"row 1\" as title\n\n            | join type=outer title [\n              | rest splunk_server=$splunk_server$ /services/data/index-volumes\n              | fields title, total_size, max_size, volume_path\n              | `dmc_exclude_volumes`\n              | eval total_size_gb = if(isnull(total_size), \"-\", round(total_size / 1024, 2))\n              | eval max_size_gb = if(isnull(max_size) OR max_size = \"infinite\", \"unlimited\", round(max_size / 1024, 2))\n              | eval disk_usage_gb = total_size_gb.\" / \".max_size_gb\n              | eval remaining_capacity_pct = (max_size_gb - total_size_gb) / max_size_gb\n              | fields title, disk_usage_gb, remaining_capacity_pct\n            ]\n\n            | eval disk_usage_gb = if(isnull(disk_usage_gb), \"N/A\", disk_usage_gb)\n            | eval \"Volume Freezing Due to Size\" = if(isnull(remaining_capacity_pct), \"N/A\", if(remaining_capacity_pct < 0.05, \"Yes\", \"No\"))\n            | rename title as \"Volume Name\" disk_usage_gb as \"Volume Usage / Capacity (GB)\"\n            | fields - remaining_capacity_pct",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Volumes",
        "query": "",
        "base": "",
        "text": "A volume is considered to be freezing or about to freeze data at 95% or more of configured disk usage capacity.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bucket Size (GB)",
        "query": "search title=$single_index_name$\n| fields hot_bucket_size_gb, warm_bucket_size_gb, cold_bucket_size_gb, thawed_bucket_size_gb\n| rename hot_bucket_size_gb as Hot, warm_bucket_size_gb as Warm, cold_bucket_size_gb as Cold, thawed_bucket_size_gb as Thawed\n| eval bucket_dir = \"\"\n| fields bucket_dir, Hot, Warm, Cold, Thawed",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "charting.chart": "column",
          "refresh.time.visible": "false",
          "charting.axisTitleX.text": "Bucket Directory",
          "charting.fieldColors": "\n          {\"Hot\": 0xd85d3c, \"Warm\": 0xf7902b, \"Cold\":0x6ab7c7, \"Thawed\":0x5379af, \"Home\": 0xfac51c}\n        "
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bucket Event Count",
        "query": "search title=$single_index_name$\n            | fields home_event_count, cold_event_count, thawed_event_count\n            | rename home_event_count as Home, cold_event_count as Cold, thawed_event_count as Thawed\n            | eval bucket_dir = \"\"\n            | fields bucket_dir, Home, Cold, Thawed",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "charting.chart": "column",
          "refresh.time.visible": "false",
          "charting.axisTitleX.text": "Bucket Directory",
          "charting.fieldColors": "\n          {\"Hot\": 0xd85d3c, \"Warm\": 0xf7902b, \"Cold\":0x6ab7c7, \"Thawed\":0x5379af, \"Home\": 0xfac51c}\n        "
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Bucket Count",
        "query": "search title=$single_index_name$\n            | fields hot_bucket_count, warm_bucket_count, cold_bucket_count, thawed_bucket_count\n            | rename hot_bucket_count as Hot, warm_bucket_count as Warm, cold_bucket_count as Cold, thawed_bucket_count as Thawed\n            | eval bucket_dir = \"\"\n            | fields bucket_dir, Hot, Warm, Cold, Thawed",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "charting.chart": "column",
          "refresh.time.visible": "false",
          "charting.axisTitleX.text": "Bucket Directory",
          "charting.fieldColors": "\n          {\"Hot\": 0xd85d3c, \"Warm\": 0xf7902b, \"Cold\":0x6ab7c7, \"Thawed\":0x5379af, \"Home\": 0xfac51c}\n        "
        }
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Event Count by Hosts ($hostCount$)",
        "query": "| metadata type=hosts index=$single_index_name$ splunk_server=$splunk_server$ datatype=$index_type_value$\n| fields host, totalCount\n| sort - totalCount\n| rename host as Host, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "dataOverlayMode": "heatmap",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Event Count by Sources ($sourceCount$)",
        "query": "| metadata type=sources index=$single_index_name$ splunk_server=$splunk_server$ datatype=$index_type_value$\n| fields source, totalCount\n| sort - totalCount\n| rename source as Source, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "dataOverlayMode": "heatmap",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Event Count by Sourcetypes ($sourcetypeCount$)",
        "query": "| metadata type=sourcetypes index=$single_index_name$ splunk_server=$splunk_server$ datatype=$index_type_value$\n| fields sourcetype, totalCount\n| sort - totalCount\n| rename sourcetype as Sourcetype, totalCount as \"Event Count\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "dataOverlayMode": "heatmap",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Paths",
        "query": "search title=$single_index_name$\n            | fields homePath, homePath_expanded, coldPath, coldPath_expanded, thawedPath, thawedPath_expanded, summaryHomePath_expanded, tstatsHomePath, tstatsHomePath_expanded\n            | transpose\n            | where column != \"_timediff\" AND column != \"_dmc_title\"\n            | rename column as Setting, \"row 1\" as Value",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Retention policies",
        "query": "search title=$single_index_name$\n            | fields maxTotalDataSizeMB, frozenTimePeriodInSecs, homePath.maxDataSizeMB, coldPath.maxDataSizeMB\n            | transpose\n            | where column != \"_timediff\" AND column != \"_dmc_title\"\n            | rename column as Setting, \"row 1\" as Value",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Index Structure & Bucket Configuration",
        "query": "search title=$single_index_name$\n            | fields maxDataSize, maxHotBuckets, maxWarmDBCount\n            | transpose\n            | where column != \"_timediff\" AND column != \"_dmc_title\"\n            | rename column as Setting, \"row 1\" as Value",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Refer to indexes.conf for more details about configuring indexes.",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Index Size Over Time",
        "query": "fields _time, disk_usage $capacityOverlay$",
        "base": "index_historical_base_search",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Index Size (GB)",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "none",
          "charting.chart.overlayFields": "disk_capacity"
        }
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Data Age Over Time",
        "query": "fields _time, data_age_days",
        "base": "index_historical_base_search",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Data Age (days)",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 14,
        "kind": "chart",
        "title": "Bucket Properties Over Time",
        "query": "index=_introspection host=$host$ sourcetype=splunk_disk_objects component=Indexes data.name=$single_index_name$\n\n            | eval warm_bucket_total_size       = if(isnotnull('data.bucket_dirs.home.warm_bucket_size'), 'data.bucket_dirs.home.warm_bucket_size', 'data.bucket_dirs.home.size')\n            | eval cold_bucket_total_size       = if(isnotnull('data.bucket_dirs.cold.bucket_size'), 'data.bucket_dirs.cold.bucket_size', 'data.bucket_dirs.cold.size')\n            | eval thawed_bucket_total_size     = if(isnotnull('data.bucket_dirs.thawed.bucket_size'), 'data.bucket_dirs.thawed.bucket_size', 'data.bucket_dirs.thawed.size')\n            | eval hot_bucket_total_size        = if(isnotnull(cold_bucket_total_size), 'data.total_size' - cold_bucket_total_size - warm_bucket_total_size, 'data.total_size' - warm_bucket_total_size)\n\n            | eval warm_bucket_total_size_gb    = round(warm_bucket_total_size / 1024, 2)\n            | eval cold_bucket_total_size_gb    = round(cold_bucket_total_size / 1024, 2)\n            | eval thawed_bucket_total_size_gb  = round(thawed_bucket_total_size / 1024, 2)\n            | eval hot_bucket_total_size_gb     = round(hot_bucket_total_size / 1024, 2)\n\n            | eval warm_bucket_count            = 'data.bucket_dirs.home.warm_bucket_count'\n            | eval hot_bucket_count             = 'data.bucket_dirs.home.hot_bucket_count'\n            | eval cold_bucket_count            = 'data.bucket_dirs.cold.bucket_count'\n            | eval thawed_bucket_count          = 'data.bucket_dirs.thawed.bucket_count'\n\n            | eval home_event_count             = 'data.bucket_dirs.home.event_count'\n            | eval cold_event_count             = 'data.bucket_dirs.cold.event_count'\n            | eval thawed_event_count           = 'data.bucket_dirs.thawed.event_count'\n\n            | eval hot_bucket_avg_size_gb       = round(hot_bucket_total_size_gb / hot_bucket_count, 2)\n            | eval warm_bucket_avg_size_gb      = round(warm_bucket_total_size_gb / warm_bucket_count, 2)\n            | eval cold_bucket_avg_size_gb      = round(cold_bucket_total_size_gb / cold_bucket_count, 2)\n            | eval thawed_bucket_avg_size_gb    = round(thawed_bucket_total_size_gb / thawed_bucket_count, 2)\n\n            | fields\n            hot_bucket_total_size_gb, warm_bucket_total_size_gb, cold_bucket_total_size_gb, thawed_bucket_total_size_gb,\n            hot_bucket_count, warm_bucket_count, cold_bucket_count, thawed_bucket_count,\n            home_event_count, cold_event_count, thawed_event_count,\n            hot_bucket_avg_size_gb, warm_bucket_avg_size_gb, cold_bucket_avg_size_gb, thawed_bucket_avg_size_gb\n\n            | `dmc_timechart_for_disk_usage` $funcBucket$(*_$single_index_metric$) as \"* bucket\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$single_index_y_label$",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.fieldColors": "\n          {\"hot bucket\": 0xd85d3c, \"warm bucket\": 0xf7902b, \"cold bucket\":0x6ab7c7, \"thawed bucket\":0x5379af, \"home bucket\": 0xfac51c}\n        "
        }
      }
    ],
    "sourceSha256": "3669226e04348033d96c2c0146ffb31e40fdf96570bdadb3b749902fb2d44fdf"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexer_clustering_service_activity.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexer_clustering_service_activity",
    "label": "Indexer Clustering: Service Activity",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Indexer Cluster",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Warning and Error Patterns",
        "query": "`dmc_get_warnings_and_errors(dmc_group_indexer, Cluster*)` search_group=\"$group$\"\n| cluster showcount=t\n| table cluster_count, _time, log_level, component, event_message, punct\n| sort - cluster_count\n| `dmc_time_format(_time)`\n| rename cluster_count AS Count, _time AS \"Latest Time\", log_level as \"Log Level\", component as Component, event_message as \"Latest Message\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Warning and Error Patterns",
        "query": "",
        "base": "",
        "text": "Click on a row to see event details.",
        "options": {}
      },
      {
        "row": 0,
        "kind": "event",
        "title": "Event Details",
        "query": "`dmc_get_warnings_and_errors(dmc_group_indexer, Cluster*)` punct=\"$warningErrorPunct$\" search_group=\"$group$\"",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Fixup Tasks - In Progress ($taskInProgressCount$)",
        "query": "$fixupProgressIndexFilter$\n            | rename title as Bucket, index as Index, peers as Peers",
        "base": "fixupInProgressBaseSearch",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Fixup Tasks - Pending",
        "query": "",
        "base": "",
        "text": "In a large deployment (with millions of buckets) the following searches might cause out-of-memory issues. Exercise caution running them.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Fixup Tasks - Pending",
        "query": "| rest splunk_server_group=dmc_group_cluster_master splunk_server_group=\"$group$\" \"/services/cluster/master/fixup?level=search_factor\"\n            | fields title, index, initial.reason, initial.timestamp, latest.reason\n            | $fixupPendingIndexFilter$\n            | `dmc_time_format(initial.timestamp)`\n            | rename title as Bucket, index as Index, initial.reason as \"Trigger Condition\", initial.timestamp as \"Trigger Time\", latest.reason as \"Current State\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Fixup Tasks - Pending",
        "query": "| rest splunk_server_group=dmc_group_cluster_master splunk_server_group=\"$group$\" \"/services/cluster/master/fixup?level=replication_factor\"\n            | fields title, index, initial.reason, initial.timestamp, latest.reason\n            | $fixupPendingIndexFilter$\n            | `dmc_time_format(initial.timestamp)`\n            | rename title as Bucket, index as Index, initial.reason as \"Trigger Condition\", initial.timestamp as \"Trigger Time\", latest.reason as \"Current State\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Fixup Tasks - Pending",
        "query": "| rest splunk_server_group=dmc_group_cluster_master splunk_server_group=\"$group$\" \"/services/cluster/master/fixup?level=generation\"\n            | fields title, index, initial.reason, initial.timestamp, latest.reason\n            | $fixupPendingIndexFilter$\n            | `dmc_time_format(initial.timestamp)`\n            | rename title as Bucket, index as Index, initial.reason as \"Trigger Condition\", initial.timestamp as \"Trigger Time\", latest.reason as \"Current State\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Indexes With Excess Buckets ($indexWithExcessBucketsCount$)",
        "query": "| rest splunk_server_group=dmc_group_cluster_master splunk_server_group=\"$group$\" /services/cluster/master/indexes\n            | fields title, buckets_with_excess_copies, buckets_with_excess_searchable_copies, total_excess_bucket_copies, total_excess_searchable_copies\n            | search (buckets_with_excess_copies > 0) OR (buckets_with_excess_searchable_copies > 0) OR (total_excess_bucket_copies > 0) OR (total_excess_searchable_copies > 0)\n            | rename title as Index, buckets_with_excess_copies as \"Buckets with Excess Copies\", buckets_with_excess_searchable_copies as \"Buckets with Excess Searchable Copies\", total_excess_bucket_copies as \"Total Excess Copies\", total_excess_searchable_copies as \"Total Excess Searchable Copies\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Bucket Fixup Tasks",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=subtask_counts name=cmmaster_service search_group=dmc_group_cluster_master search_group=\"$group$\"\n| fields - to_fix_total to_fix_added to_fix_removed\n| `dmc_timechart_for_metrics_log` median(to_fix_*) as to_fix_*\n| rename to_fix_sync AS Sync to_fix_data_safety AS \"Data safety\" to_fix_gen AS Generation to_fix_rep_factor AS \"Replication factor\" to_fix_search_factor AS \"Search factor\" to_fix_streaming AS Streaming",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY.text": "Task Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Service Jobs",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=executor name=cmmaster_executor search_group=dmc_group_cluster_master search_group=\"$group$\"\n| eval backlog_change = jobs_added - jobs_finished\n| `dmc_timechart_for_metrics_log` sum(jobs_added) AS \"Jobs added\" sum(jobs_finished) AS \"Jobs finished\" sum(backlog_change) AS \"Backlog change\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY.text": "Job Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Service Jobs",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=jobs name=cmmaster search_group=dmc_group_cluster_master search_group=\"$group$\"\n| `dmc_timechart_for_metrics_log` sum(CMRepJob) AS \"Bucket replication\" sum(CMChangeBucketJob_build) AS \"Make bucket searchable\" sum(CMChangeBucketJob_makePrimary) AS \"Make bucket primary\" sum(CMChangeBucketJob_removePrimary) AS \"Removing primary bucket site\" sum(CMTruncJob) AS \"Truncating size of bucket\" sum(CMSyncM2PJob) AS \"Syncing buckets for peers and master\" sum(CMSyncP2PJob) AS \"Syncing bucket between peers\" sum(CMBucketFrozenJob) AS \"Notifying peer that bucket is frozen\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY.text": "Job Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "REST Endpoint Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=subtask_seconds name=cmmaster_endpoints search_group=dmc_group_cluster_master search_group=\"$group$\"\n| `dmc_timechart_for_metrics_log` sum(cluster*) as cluster*\n| rename clustermaster*_* AS \"/services/cluster/master/*:*\" clusterconfig_* AS \"/services/cluster/config:*\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY.text": "Time Spent (seconds)",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "REST Endpoint Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=subtask_counts name=cmmaster_endpoints search_group=dmc_group_cluster_master search_group=\"$group$\"\n| `dmc_timechart_for_metrics_log` sum(clustermaster*) as clustermaster*\n| rename clustermaster*_* AS \"/services/cluster/master/*:*\" clusterconfig_* AS \"/services/cluster/config:*\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1"
        }
      }
    ],
    "sourceSha256": "c1d6f9d0d0f1b05ce36dc0b083b952ffe82322c03eedf8fa6348ff1f3cbb0e31"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexer_clustering_status.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexer_clustering_status",
    "label": "Indexer Clustering: Status",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Indexer Cluster",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "$cluster_master_indicator$\n          $searchable_indicator$\n          $search_factor_indicator$\n          $replication_factor_indicator$\n        \n        \n          \n            $searchable_peer_count$ searchable $not_searchable_peer_count$ not searchable\n          \n            $searchable_index_count$ searchable $not_searchable_index_count$ not searchable\n        \n        \n          Peers\n          Indexes",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Peers ($peerCount$)",
        "query": "fields label, is_searchable, status, site, bucket_count, host_port_pair, last_heartbeat, replication_port, base_generation_id, title, bucket_count_by_index.*\n            | eval is_searchable = if(is_searchable == 1 or is_searchable == \"1\", \"Yes\", \"No\")\n            | `dmc_time_format(last_heartbeat)`\n            | sort - last_heartbeat\n            | $peerNameFilter$\n            | $peerSearchableFilter$\n            | $peerStatusFilter$\n            | $peerSiteFilter$\n            | fields label, is_searchable, status, site, bucket_count\n            | rename label as Peer, is_searchable as \"Fully Searchable\", status as Status, site as Site, bucket_count as Buckets",
        "base": "peers_base_search",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Peers ($peerCount$)",
        "query": "",
        "base": "",
        "text": "Click on each peer to see more details.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "$peerDrilldown$",
        "query": "search label = $peerDrilldown$\n            | `dmc_time_format(last_heartbeat)`\n            | fields host_port_pair, last_heartbeat, replication_port, base_generation_id, title\n            | rename host_port_pair as Location, last_heartbeat as \"Last Heartbeat\", replication_port as \"Replication Port\", base_generation_id as \"Base Generation ID\", title as GUID\n            | transpose\n            | rename column as Property, \"row 1\" as Value",
        "base": "peers_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "$peerDrilldown$",
        "query": "search label = $peerDrilldown$\n            | fields bucket_count_by_index.*\n            | transpose\n            | rename column as Index, \"row 1\" as Buckets\n            | eval Index=replace(Index, \"bucket_count_by_index.\", \"\")\n            | where isnotnull(Buckets) AND isnotnull(Index)",
        "base": "peers_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "$peerDrilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Indexes ($indexCount$)",
        "query": "fields title, is_searchable, replicated_copies_tracker*, searchable_copies_tracker*, num_buckets, index_size\n            | rename replicated_copies_tracker.*.* as rp**, searchable_copies_tracker.*.* as sb**\n            | eval replicated_data_copies = \"\"\n            | foreach rp*actual_copies_per_slot [eval replicated_data_copies = replicated_data_copies.\" \".rp<<MATCHSTR>>actual_copies_per_slot.\"/\".rp<<MATCHSTR>>expected_total_per_slot]\n            | makemv replicated_data_copies\n            | eval searchable_data_copies = \"\"\n            | foreach sb*actual_copies_per_slot [eval searchable_data_copies = searchable_data_copies.\" \".sb<<MATCHSTR>>actual_copies_per_slot.\"/\".sb<<MATCHSTR>>expected_total_per_slot]\n            | makemv searchable_data_copies\n            | eval is_searchable = if((is_searchable == 1) or (is_searchable == \"1\"), \"Yes\", \"No\")\n            | eval index_size = round(index_size / 1024 / 1024 / 1024, 2).\" GB\"\n            | fields title, is_searchable, searchable_data_copies, replicated_data_copies, num_buckets, index_size\n            | $indexNameFilter$\n            | $indexSearchableFilter$\n            | rename title as \"Index Name\", is_searchable as \"Fully Searchable\", searchable_data_copies as \"Searchable Data Copies\", replicated_data_copies as \"Replicated Data Copies\", num_buckets as Buckets, index_size as \"Cumulative Raw Data Size\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Indexes ($indexCount$)",
        "query": "",
        "base": "",
        "text": "Bucket Status",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Search Heads ($searchHeadCount$)",
        "query": "$searchHeadNameFilter$\n            | $searchHeadStatusFilter$\n            | $searchHeadSiteFilter$\n            | rename label as \"Search Head\", status as Status, site as Site, host_port_pair as URI, title as GUID",
        "base": "searchHeadBaseSearch",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      }
    ],
    "sourceSha256": "fc29a260f674dd43a2b4bc277f1be997b70c12f97d1b9fcd0565efc42c3992ab"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexes_and_volumes_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexes_and_volumes_deployment",
    "label": "Indexes and Volumes: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "datatype",
        "label": "Index Type",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Event Indexes Only"
          },
          {
            "value": "datatype=all",
            "label": "All Index Types *"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Overview",
        "query": "stats dc(title) as numIndexes",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Total Indexes",
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Overview",
        "query": "stats dc(eval(if(isnotnull(indexSizeGB), title, null()))) as nonEmptyIndexes",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Non-Empty Indexes",
          "height": "80px"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Overview",
        "query": "stats dc(splunk_server) AS instances",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Instances",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Index Size",
        "query": "stats sum(indexSizeGB) as totalSize\n                        | eval totalSize = if(isNum(totalSize), round(totalSize, 2).\" GB\", \"N/A\")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Total Across Deployment",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Index Size",
        "query": "stats sum(indexSizeGB) as totalSize\n                        dc(splunk_server) as instances\n                        | eval averageAggregateIndexesSizePerInstance = round(totalSize / instances, 2).\" GB\"\n                        | fields averageAggregateIndexesSizePerInstance",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Averaged Across All Indexers",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Data Age",
        "query": "stats median(dataAge) AS medianDataAge\n                        | eval medianDataAge = if(isNum(medianDataAge), medianDataAge.\" days\", \"N/A\")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Median",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Data Age",
        "query": "stats max(dataAge) AS oldestDataAge\n                        | eval oldestDataAge = if(isNum(oldestDataAge), oldestDataAge.\" days\", \"N/A\")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "underLabel": "Oldest",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Indexes ($indexCount$)",
        "query": "stats dc(splunk_server) AS Instances\n                        count(indexSizeGB) as \"Non-Empty Instances\"\n                        sum(indexSizeGB) AS totalSize\n                        avg(indexSizeGB) as averageSize\n                        avg(sizeUsagePerc) as averageSizePerc\n                        perc90(sizeUsagePerc) as ninetyPercentileSizePerc\n                        count(eval(sizeUsagePerc > 95)) as instancesFreezingDueToSize\n                        median(dataAge) as medianDataAge\n                        max(dataAge) as oldestDataAge\n                        count(eval(elapsedTime > frozenTimePeriodInSecs)) as instancesFreezingDueToAge\n                        sum(frozenTimePeriodInSecs) as infiniteFreezingFlag\n                        by title, datatype\n                        | eval totalSize = if(isnotnull(totalSize), round(totalSize, 2), 0)\n                        | eval averageSize = if(isnotnull(averageSize), round(averageSize, 2), 0)\n                        | eval averageSizePerc = if(isnotnull(averageSizePerc), round(averageSizePerc, 2).\"%\", \"N/A\")\n                        | eval ninetyPercentileSizePerc = if(isnotnull(ninetyPercentileSizePerc), round(ninetyPercentileSizePerc, 2).\"%\", \"N/A\")\n                        | eval instancesFreezingDueToSize = if(averageSizePerc != \"N/A\", instancesFreezingDueToSize, \"N/A\")\n                        | eval medianDataAge = if(isNum(medianDataAge), medianDataAge, \"N/A\")\n                        | eval oldestDataAge = if(isNum(oldestDataAge), oldestDataAge, \"N/A\")\n                        | eval instancesFreezingDueToAge = if(infiniteFreezingFlag > 0, instancesFreezingDueToAge, \"N/A\")\n                        | rename title as \"Index\"\n                        datatype as \"Data Type\"\n                        totalSize as \"Total Size (GB)\"\n                        averageSize as \"Average Size (GB)\"\n                        averageSizePerc as \"Average Usage (%)\"\n                        ninetyPercentileSizePerc as \"90th Percentile Usage (%)\"\n                        instancesFreezingDueToSize as \"Instances Freezing Due To Size*\"\n                        medianDataAge as \"Median Data Age (days)\"\n                        oldestDataAge as \"Oldest Data Age (days)\"\n                        instancesFreezingDueToAge as \"Instances Freezing Due to Age\"\n                        | fields - infiniteFreezingFlag",
        "base": "indexes_base_search",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Indexes ($indexCount$)",
        "query": "",
        "base": "",
        "text": "Click on instance name for more details.\n                *Number of instances freezing or about to freeze data at 95% or more of configured disk usage capacity.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Volumes ($volumeCount$)",
        "query": "| rest splunk_server_group=dmc_group_indexer splunk_server_group=\"$group$\" services/data/index-volumes\n                        | `dmc_exclude_volumes`\n                        | eval volumeSizeGB = if(total_size > 1, round(total_size / 1024, 2), null())\n                        | eval sizeUsagePerc = total_size / max_size * 100\n                        | stats dc(splunk_server) as Instances\n                        count(eval(total_size > 1)) as \"Non-Empty Instances\"\n                        sum(volumeSizeGB) as totalSize\n                        avg(volumeSizeGB) as avgSize\n                        avg(sizeUsagePerc) as avgSizePerc\n                        perc90(sizeUsagePerc) as ninetyPercentileSizePerc\n                        count(eval(total_size > max_size)) as volumesFreezingDueToSize\n                        by title\n                        | eval totalSize = if(isnotnull(totalSize), totalSize, 0)\n                        | eval avgSize = if(isnotnull(avgSize), round(avgSize, 2), 0)\n                        | eval avgSizePerc = if(isnotnull(avgSizePerc), round(avgSizePerc, 2).\"%\", \"N/A\")\n                        | eval ninetyPercentileSizePerc = if(isnotnull(ninetyPercentileSizePerc), round(ninetyPercentileSizePerc, 2).\"%\", \"N/A\")\n                        | eval volumesFreezingDueToSize = if(avgSizePerc != \"N/A\", volumesFreezingDueToSize, \"N/A\")\n                        | rename title as \"Volume\"\n                        totalSize as \"Total Size (GB)\"\n                        avgSize as \"Average Size (GB)\"\n                        avgSizePerc as \"Average Usage (%)\"\n                        ninetyPercentileSizePerc as \"90th Percentile Usage (%)\"\n                        volumesFreezingDueToSize as \"Volumes Freezing Due To Size\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Volumes ($volumeCount$)",
        "query": "",
        "base": "",
        "text": "Click on volume name for more details.",
        "options": {}
      }
    ],
    "sourceSha256": "ee61dccf26b2430e2fa2351dff04ec45e3683b697f19f9fa798895091845b92e"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexes_and_volumes_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexes_and_volumes_instance",
    "label": "Indexes and Volumes: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "datatype",
        "label": "Index Type",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Event Indexes Only"
          },
          {
            "value": "datatype=all",
            "label": "All Index Types *"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "stats sum(currentDBSizeGB) as total_gb\n            | eval total_gb = case(\n                total_gb > 1000, round(total_gb / 1024, 2).\" TB\",\n                1 = 1, total_gb.\" GB\"\n              )",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Index Size"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "stats sum(totalEventCount) as totalEventCount\n            | eval totalEventCount = tostring(totalEventCount, \"commas\")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Event Count"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "stats sum(total_bucket_count) as total_bucket_count\n            | eval total_bucket_count = tostring(total_bucket_count, \"commas\")",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Bucket Count"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Indexes ($indexCount$)",
        "query": "fields title, datatype, freeze_period_viz, disk_usage_gb, home_bucket_usage_gb, cold_bucket_usage_gb, totalEventCount, total_bucket_count\n            | eval total_bucket_count=tostring(total_bucket_count, \"commas\")\n            | eval totalEventCount=tostring(totalEventCount, \"commas\")\n            | rename title as Index, datatype as \"Data Type\", disk_usage_gb as \"Index Usage (GB)\", freeze_period_viz as \"Data Age vs Frozen Age (days)\", home_bucket_usage_gb as \"Home Path Usage (GB)\", cold_bucket_usage_gb as \"Cold Path Usage (GB)\", total_bucket_count as \"Total Bucket Count\", totalEventCount as \"Total Event Count\"",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Indexes ($indexCount$)",
        "query": "",
        "base": "",
        "text": "The columns use attributes specified in indexes.conf:\n        \n          Data Age vs Frozen Age: The first value is based on the age of the oldest event in the index. The second value is derived from the attribute frozenTimePeriodInSecs.\n          Index Usage: The first value is the current size of the index. The second value is the index capacity, as specified  in maxTotalDataSizeMB.\n          Home Path Usage: The first value is the current size of the home path portion of the index. The second value is the home path capacity, as specified in homePath.maxDataSizeMB.\n          Cold Path Usage: The first value is the current size of the cold path portion of the index. The second value is the cold path capacity, as specified in coldPath.maxDataSizeMB.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Volumes ($volumeCount$)",
        "query": "| rest splunk_server=$splunk_server$ /services/data/index-volumes\n            | fields title, total_size, max_size, volume_path\n            | `dmc_exclude_volumes`\n            | eval total_size_gb = if(isnull(total_size), \"-\", round(total_size / 1024, 2))\n            | eval max_size_gb = if(isnull(max_size) OR max_size = \"infinite\", \"unlimited\", round(max_size / 1024, 2))\n            | eval disk_usage_gb = total_size_gb.\" / \".max_size_gb\n            | fields title, disk_usage_gb, max_size_gb, volume_path\n            | rename title as Volume, disk_usage_gb as \"Volume Usage (GB)\", max_size_gb as \"Volume Capacity (GB)\", volume_path as \"Volume Path\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Volumes ($volumeCount$)",
        "query": "",
        "base": "",
        "text": "Volume Usage: The first value is the current size of the volume. The second value is the volume capacity, as specified by the maxVolumeDataSizeMB attribute in indexes.conf.\n        Note: if the volume is \"unlimited\", it is not possible to determine the disk usage for the volume.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Volume Usage by Indexes and Directories",
        "query": "fields title, cold_bucket_size_gb, home_bucket_size_gb, homePath, coldPath\n| rex field=homePath \"volume:(?<home_vol_name>[^/\\\\\\]*)(?:/|\\\\\\)\"\n| rex field=coldPath \"volume:(?<cold_vol_name>[^/\\\\\\]*)(?:/|\\\\\\)\"\n| eval dir = \"home,cold\"\n| makemv dir delim=\",\"\n| mvexpand dir\n| eval dir_size = case(dir == \"home\", home_bucket_size_gb, dir == \"cold\", cold_bucket_size_gb)\n| eval vol_name = case(dir == \"home\", home_vol_name, dir == \"cold\", cold_vol_name)\n| fields title dir dir_size vol_name\n| where isnotnull(vol_name) AND isnotnull(dir_size) AND dir_size > 0\n| eval index_dir_name = title.\":\".dir\n| chart sum(dir_size) AS dir_size over vol_name by index_dir_name",
        "base": "indexes_base_search",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Volume Names",
          "charting.axisTitleY.text": "Volume Usage (GB)",
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$index_metric_label$ of Indexes Over Time",
        "query": "index=_introspection host=$host$ sourcetype=splunk_disk_objects component=Indexes\n            | `dmc_exclude_indexes`\n            | eval data.total_size = round('data.total_size' / 1024, 2)\n            | `dmc_timechart_for_disk_usage` $funcIndex$($index_metric$) as total by data.name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$index_y_label$",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Volume Size Over Time",
        "query": "index=_introspection host=$host$ sourcetype=splunk_disk_objects component=Volumes\n            | eval data.total_size = round('data.total_size' / 1024, 2)\n            | `dmc_timechart_for_disk_usage` $funcVolume$(data.total_size) as total_size by data.name",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Size (GB)",
          "charting.axisLabelsY.majorUnit": "1"
        }
      }
    ],
    "sourceSha256": "be98febbc50e193991e0cb98b29c0028cbc38bda97cf95e5bc1cb48a3cc97b2d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_advanced.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_advanced",
    "label": "Indexing Performance: Advanced",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Indexing Overview",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/indexer\n            | eval status = if((reason == \".\") OR (reason == \"\") OR isnull(reason), status, status.\": \".reason)\n            | fields splunk_server, average_KBps, status\n            | eval average_KBps = round(average_KBps, 0)\n            | join type=outer [\n              | rest splunk_server=$splunk_server$ /services/properties/server/general/pipelineSetSelectionPolicy\n              | fields value\n              | rename value as pipeline_set_selection_policy]\n            | join type=outer [\n              | rest splunk_server=$splunk_server$ /services/properties/server/general/parallelIngestionPipelines]\n            | fields splunk_server, value, pipeline_set_selection_policy, average_KBps, status\n            | rename splunk_server as Instance, value as \"Pipeline Set Count\", pipeline_set_selection_policy as \"Pipeline Set Selection Policy\", average_KBps as \"Indexing Rate (KB/s)\", status as Status, reason as Reason",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Indexing Overview",
        "query": "",
        "base": "",
        "text": "Indexing rate measured over 30 seconds every 30 seconds (available with Splunk Enterprise 6.2 or later indexers).\n        You can configure pipeline set selection policies in server.conf. Learn more",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Splunkd Thread Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=\"*metrics.log\" group=dutycycle\n            | eval dutycycle_ratio_perc=ratio*100\n            | `dmc_timechart_for_metrics_log` avg(dutycycle_ratio_perc) by thread limit=30",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.chart": "line",
          "charting.drilldown": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Thread Activity (%)"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Splunkd Thread Activity",
        "query": "",
        "base": "",
        "text": "This graph shows the average thread activity of all Splunkd threads.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Ingestion Pipeline Activity By Pipeline Set",
        "query": "`dmc_set_index_internal` host=$host$ source=\"*metrics.log\" group=dutycycle name=ingest\n            | fillnull value=0 ingest_pipe\n            | search ingest_pipe=$log_pipe_scope$\n            | eval dutycycle_ratio_perc=ratio*100\n            | chart limit=30 avg(dutycycle_ratio_perc) over ingest_pipe by thread\n            | rename ingest_pipe as \"Pipeline Set\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.drilldown": "none",
          "charting.axisTitleY.text": "Thread Activity"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Ingestion Pipeline Activity By Pipeline Set",
        "query": "",
        "base": "",
        "text": "This chart shows the average activity of ingestion pipelines grouped by pipeline set.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Busiest Ingestion Pipeline By Pipeline Set (Incidents)",
        "query": "`dmc_set_index_internal` host=$host$ ingest_pipe=$log_pipe_scope$ source=\"*metrics.log\" group=pipelineset name=load_metrics\n            | chart limit=30 count(busiest_thread_name) over ingest_pipe by busiest_thread_name\n            | rename ingest_pipe as \"Pipeline Set\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked100",
          "charting.drilldown": "none",
          "charting.axisTitleY.text": "Incidents"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Busiest Ingestion Pipeline By Pipeline Set (Incidents)",
        "query": "",
        "base": "",
        "text": "This chart shows the count of busiest ingestion pipeline incidents grouped by pipeline set.\n          The busiest ingestion pipeline corresponds to the ingestion pipeline with the highest\n          thread activity during the measurement period.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Busiest Ingestion Pipeline By Pipeline Set (Thread Activity)",
        "query": "`dmc_set_index_internal` host=$host$ ingest_pipe=$log_pipe_scope$ source=\"*metrics.log\" group=pipelineset name=load_metrics\n            | eval dutycycle_ratio_perc=dutycycle_ratio*100\n            | `dmc_timechart_for_metrics_log` max(dutycycle_ratio_perc) by ingest_pipe",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.chart": "line",
          "charting.drilldown": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Thread Activity (%)"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Busiest Ingestion Pipeline By Pipeline Set (Thread Activity)",
        "query": "",
        "base": "",
        "text": "This graph shows the maximum thread activity of the busiest ingestion pipeline grouped by pipeline set.\n          The busiest ingestion pipeline corresponds to the ingestion pipeline with the highest\n          thread activity during the measurement period.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Ingestion Assignment Probability Per Pipeline Set",
        "query": "`dmc_set_index_internal` host=$host$ ingest_pipe=$log_pipe_scope$ source=\"*metrics.log\" group=pipelineset name=load_metrics\n            | eval pipeline_set_selection_perc=share*100\n            | `dmc_timechart_for_metrics_log` max(pipeline_set_selection_perc) by ingest_pipe",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked100",
          "charting.drilldown": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Pipeline Set Selection Probability"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Ingestion Assignment Probability Per Pipeline Set",
        "query": "",
        "base": "",
        "text": "This chart shows the relative pipeline set selection probability for new ingestion assignment requests.\n          This probability is a factor of the pipeline set selection policy shown in the Indexing Overview chart above.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Ingestion Assignments Per Pipeline Set",
        "query": "`dmc_set_index_internal` host=$host$ ingest_pipe=$log_pipe_scope$ source=\"*metrics.log\" group=pipelineset name=load_metrics\n            | `dmc_timechart_for_metrics_log` max(requests_last_period) by ingest_pipe",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.drilldown": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Ingestion Assignments"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Ingestion Assignments Per Pipeline Set",
        "query": "",
        "base": "",
        "text": "This graph shows the number of ingestion assignments grouped by pipeline set.\n          The ingestion assignments correspond to each new ingestion connection request to the indexer.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Estimated CPU Usage per Splunk Processor",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log sourcetype=splunkd group=pipeline NOT processor=sendout\n            | eval ingest_pipe = if(isnotnull(ingest_pipe), ingest_pipe, \"none\")\n            | search ingest_pipe=$log_pipe_scope$\n            | `dmc_timechart_for_metrics_log` per_second(eval(cpu_seconds*100)) AS pctCPU by processor useother=false limit=15",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.chart": "column"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Aggregate CPU Seconds Spent per Indexer Processor Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log sourcetype=splunkd group=pipeline name=indexerpipe processor=indexer\n            | eval ingest_pipe = if(isnotnull(ingest_pipe), ingest_pipe, \"none\")\n            | search ingest_pipe=$log_pipe_scope$\n            | `dmc_timechart_for_metrics_log` sum(write_cpu_seconds) AS \"raw data write\" sum(service_cpu_seconds) AS \"index service\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU seconds"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Aggregate CPU Seconds Spent per Indexer Processor Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log sourcetype=splunkd group=subtask_seconds\n            | eval ingest_pipe = if(isnotnull(ingest_pipe), ingest_pipe, \"none\")\n            | search ingest_pipe=$log_pipe_scope$\n            | fields replicate_semislice, sync_hotBkt, throttle_optimize, flushBlockSig, retryMove_1hotBkt, size_hotBkt, roll_hotBkt, chillOrFreeze, update_checksums, fork_recovermetadata, rebuild_metadata, update_bktManifest, service_volumes, service_maxSizes, service_externProc\n            | `dmc_timechart_for_metrics_log` sum(*) AS *",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU seconds"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "$processorTypeCpuProfLabel$ Processor CPU Profiling per $groupTypeCpuProfLabel$",
        "query": "",
        "base": "",
        "text": "Index-time transformation detail available with Splunk Enterprise 6.6.0 or later indexers. Learn More",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Total CPU time",
        "query": "`dmc_timechart_for_metrics_log` $functionQueueCpuProf$(cpu_time_ms) by series",
        "base": "internal_metrics_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "CPU milliseconds"
        }
      },
      {
        "row": 12,
        "kind": "html",
        "title": "Total CPU time",
        "query": "",
        "base": "",
        "text": "Total time (in milliseconds) spent by the $processorTypeCpuProfLabel$ processor, split per $groupTypeCpuProfLabel$.",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "CPU time per event",
        "query": "`dmc_timechart_for_metrics_log` $functionQueueCpuProf$(avg_cpu_time_per_event_ms) by series",
        "base": "internal_metrics_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Milliseconds spent per event"
        }
      },
      {
        "row": 12,
        "kind": "html",
        "title": "CPU time per event",
        "query": "",
        "base": "",
        "text": "Average time (in milliseconds) spent by the $processorTypeCpuProfLabel$ processor, split per $groupTypeCpuProfLabel$.",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Bytes",
        "query": "`dmc_timechart_for_metrics_log` $functionQueueCpuProf$(bytes) by series",
        "base": "internal_metrics_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total number of bytes"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "Bytes",
        "query": "",
        "base": "",
        "text": "Total number of bytes processed by the $processorTypeCpuProfLabel$ processor, split by $groupTypeCpuProfLabel$.",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Event count",
        "query": "`dmc_timechart_for_metrics_log` $functionQueueCpuProf$(event_count) by series",
        "base": "internal_metrics_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total number of events"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "Event count",
        "query": "",
        "base": "",
        "text": "Total number of events processed by the $processorTypeCpuProfLabel$ processor, split by $groupTypeCpuProfLabel$.",
        "options": {}
      }
    ],
    "sourceSha256": "4575eca50fb32eb28609edc2a6e9b4ab9d78cb9473af4eed316c08218b6516b6"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_deployment",
    "label": "Indexing Performance: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview of Indexing Performance",
        "query": "stats count",
        "base": "parallel_pipe_api_base",
        "text": "",
        "options": {
          "underLabel": "Indexers",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview of Indexing Performance",
        "query": "stats sum(average_KBps)",
        "base": "parallel_pipe_api_base",
        "text": "",
        "options": {
          "underLabel": "Total Indexing Rate",
          "afterLabel": "KB/s",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview of Indexing Performance",
        "query": "stats avg(average_KBps) as avg_indexing_rate\n| eval avg_indexing_rate = round(avg_indexing_rate, 0)",
        "base": "parallel_pipe_api_base",
        "text": "",
        "options": {
          "underLabel": "Average Indexing Rate",
          "afterLabel": "KB/s",
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview of Indexing Performance",
        "query": "stats median(average_KBps)",
        "base": "parallel_pipe_api_base",
        "text": "",
        "options": {
          "underLabel": "Median Indexing Rate",
          "afterLabel": "KB/s",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Indexing Performance by Instance",
        "query": "rename splunk_server as Instance, pset_count as \"Pipeline Set Count\", average_KBps as \"Indexing Rate (KB/s)\", status as \"Status\", parsingQueue as \"Parsing Queue Fill Ratio (%)\", aggQueue as \"Aggregation Queue Fill Ratio (%)\", \"typingQueue\" as \"Typing Queue Fill Ratio (%)\", indexQueue as \"Indexing Queue Fill Ratio (%)\"",
        "base": "parallel_pipe_api_base",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Indexing Performance by Instance",
        "query": "",
        "base": "",
        "text": "Click instance name for more details. \n        Indexing rate measured over 30 seconds every 30 seconds (available with Splunk Enterprise 6.2 or later indexers).",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances By Indexing Rate",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "viz",
        "title": "Instances By Indexing Rate",
        "query": "`dmc_set_index_internal` source=*metrics.log* sourcetype=splunkd search_group=dmc_group_indexer search_group=\"$group$\" group=thruput name=index_thruput\n                    | `dmc_timechart_for_metrics_log` partial=f limit=0 per_second(kb) AS kbps by host\n                    | untable _time host kbps\n                    | eval kbps = round(kbps,0)\n                    | `dmc_indexing_rate_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "height": "300"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Instances By Indexing Rate",
        "query": "`dmc_set_index_internal` source=*metrics.log* sourcetype=splunkd search_group=dmc_group_indexer search_group=\"$group$\" group=thruput name=index_thruput\n| `dmc_timechart_for_metrics_log` partial=f limit=0 per_second(kb) AS kbps by host\n| untable _time host kbps\n| eval kbps = round(kbps,0)\n| `dmc_indexing_rate_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.fieldColors": "\n          {\"0-50 KB/s\": 0xe6ecf3,\n           \"50-100 KB/s\": 0xcdd8e7,\n           \"100-500 KB/s\": 0xb4c5db,\n           \"500 KB/s - 1 MB/s\": 0x9cb1d0,\n           \"1-2.5 MB/s\": 0x839ec4,\n           \"2.5-5 MB/s\": 0x6a8ab8,\n           \"5-10 MB/s\": 0x5177ac,\n           \"10+ MB/s\": 0x3863a0\n          }\n        "
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Instances By Indexing Rate",
        "query": "`dmc_drilldown_indexing_performance_deployment_indexing_rate(\"$group$\", $drilldown_indexing_rate_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances By Indexing Rate",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Indexing Rate By Instance",
        "query": "`dmc_set_index_internal` source=*metrics.log* sourcetype=splunkd search_group=dmc_group_indexer search_group=\"$group$\" group=thruput name=index_thruput\n| `dmc_timechart_for_metrics_log` partial=f per_second(kb) AS kbps by host\n| eval kbps = round(kbps, 0)",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "KB/s"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Deployment-Wide $aggrIdxRateLabel$ Indexing Rate",
        "query": "`dmc_set_index_internal` source=*metrics.log* sourcetype=splunkd search_group=dmc_group_indexer search_group=\"$group$\" group=thruput name=index_thruput \n| `dmc_timechart_for_metrics_log` partial=f per_second(kb) AS kbps dc(host) AS num_hosts \n| eval kbps = kbps / $aggrIdxRateDivider$ \n| eval kbps = round(kbps, 0)\n| rename kbps as \"KB/s\"\n| fields - num_hosts",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "KB/s"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by indexing rate over time.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Indexing rate over time by instance.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Instances By $instanceWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "viz",
        "title": "Instances By $instanceWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=$instanceWideFillRatioQueueType$\n                    | eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n                    | eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n                    | eval fill_perc=round((curr/max)*100,2)\n                    | bin _time minspan=30s\n                    | stats $instanceWideFillRatioAggrFunc$(fill_perc) AS \"fill_percentage\" by host, _time\n                    | `dmc_queue_fill_ratio_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Instances By $instanceWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=$instanceWideFillRatioQueueType$\n| eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n| eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n| eval fill_perc=round((curr/max)*100,2)\n| bin _time minspan=30s\n| stats $instanceWideFillRatioAggrFunc$(fill_perc) AS \"fill_percentage\" by host, _time\n| `dmc_queue_fill_ratio_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Instances By $instanceWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "`dmc_drilldown_indexing_performance_deployment_queue_fill_ratio(\"$group$\", $instanceWideFillRatioQueueType$, $instanceWideFillRatioAggrFunc$, $drilldown_queue_fill_ratio_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Instances By $instanceWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$instanceWideFillRatioAggrLabel$ Queue Fill Ratio By Instance",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=$instanceWideFillRatioQueueType$\n| eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n| eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n| eval fill_perc=round((curr/max)*100,2)\n| `dmc_timechart_for_metrics_log` partial=f limit=25 $instanceWideFillRatioAggrFunc$(fill_perc) AS fill_percentage by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Queue % filled",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Deployment-Wide $deploymentWideFillRatioAggrLabel$ Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=$deploymentWideFillRatioQueueType$\n| eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n| eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n| eval fill_perc=round((curr/max)*100,2)\n| `dmc_timechart_for_metrics_log` partial=f $deploymentWideFillRatioAggrFunc$(fill_perc) AS fill_percentage",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Queue % filled",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $instanceWideFillRatioAggrLabel$ fill ratio of the selected queue over time.\n        If parallel pipeline sets are defined, queue fill ratios are aggregated across all pipeline sets.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "$instanceWideFillRatioAggrLabel$ fill ratio of the selected queue over time by instance.\n        If parallel pipeline sets are defined, queue fill ratios are aggregated across all pipeline sets.",
        "options": {}
      }
    ],
    "sourceSha256": "be0ad89d3213d2e86c7aa50f38d14d80e6a37597c9018145c73326a3c8f499b9"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "indexing_performance_instance",
    "label": "Indexing Performance: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Indexing Overview",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/indexer\n            | eval status = if((reason == \".\") OR (reason == \"\") OR isnull(reason), status, status.\": \".reason)\n            | fields splunk_server, average_KBps, status\n            | eval average_KBps = round(average_KBps, 0)\n            | join type=outer [\n              | rest splunk_server=$splunk_server$ /services/properties/server/general/pipelineSetSelectionPolicy\n              | fields value\n              | rename value as pipeline_set_selection_policy]\n            | join type=outer [\n              | rest splunk_server=$splunk_server$ /services/properties/server/general/parallelIngestionPipelines]\n            | fields splunk_server, value, pipeline_set_selection_policy, average_KBps, status\n            | rename splunk_server as Instance, value as \"Pipeline Set Count\", pipeline_set_selection_policy as \"Pipeline Set Selection Policy\", average_KBps as \"Indexing Rate (KB/s)\", status as Status, reason as Reason",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Indexing Overview",
        "query": "",
        "base": "",
        "text": "Indexing rate measured over 30 seconds every 30 seconds (available with Splunk Enterprise 6.2 or later indexers).\n        The Pipeline Set selection policies can be set in server.conf. Learn more",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Splunk Enterprise Data Pipeline",
        "query": "",
        "base": "",
        "text": "$parsing_queue_value$\n          $agg_queue_value$\n          $typing_queue_value$\n          $index_queue_value$",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Splunk Enterprise Parallel Data Pipelines",
        "query": "search title=\"parsingQueue.*\" OR title=\"aggQueue.*\" OR title=\"typingQueue.*\" OR title=\"indexQueue.*\"\n            | rex field=title \"(?<queue_name>^\\w+)\\.(?<pipeline_number>\\d+)\"\n            | chart values(current_fill_perc) over pipeline_number by queue_name\n            | fields pipeline_number, parsingQueue, aggQueue, typingQueue, indexQueue\n            | rename pipeline_number as \"Pipeline Number\", parsingQueue as \"Parsing Queue Fill Ratio (%)\", aggQueue as \"Aggregator Queue Fill Ratio (%)\", typingQueue as \"Typing Queue Fill Ratio (%)\", indexQueue as \"Index Queue Fill Ratio (%)\"",
        "base": "pipeline_queue_api_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Estimated Indexing Rate Per $groupTypeIdxPerfLabel$",
        "query": "`dmc_set_index_internal` host=$host$ source=\"*metrics.log\" sourcetype=splunkd group=per_$groupTypeIdxPerf$_thruput\n            | eval ingest_pipe = if(isnotnull(ingest_pipe), ingest_pipe, \"none\")\n            | search ingest_pipe=$log_pipe_scope$\n            | `dmc_timechart_for_metrics_log` per_second(kb) by series useother=false limit=15",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Indexing Rate (KB/s)"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$funcQueueLabel$ Fill Ratio of Data Processing Queues",
        "query": "`dmc_set_index_internal` host=$host$ source=*metrics.log sourcetype=splunkd group=queue $queues$\n| eval ingest_pipe = if(isnotnull(ingest_pipe), ingest_pipe, \"none\")\n| search ingest_pipe=$log_pipe_scope$\n| eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n| eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n| eval fill_perc=round((curr/max)*100,2)\n| `dmc_timechart_for_metrics_log` $functionQueue$(fill_perc) by name useother=false limit=15",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "height": "500px",
          "charting.layout.splitSeries": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Fill Ratio (%)",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      }
    ],
    "sourceSha256": "4af6dc9a3e0e5a1703b07a809b92f28c619c6a96a80aba9feab1656f52fe2d41"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "kv_store_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "kv_store_deployment",
    "label": "KV Store: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All KV Stores"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Warning and Error Patterns",
        "query": "`dmc_get_warnings_and_errors(dmc_group_kv_store, KVStore*)` search_group=\"$group$\"\n| cluster showcount=t\n| table cluster_count, _time, log_level, component, event_message, punct\n| sort - cluster_count\n| `dmc_time_format(_time)`\n| rename cluster_count AS Count, _time AS \"Latest Time\", log_level as \"Log Level\", component as Component, event_message as \"Latest Message\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Warning and Error Patterns",
        "query": "",
        "base": "",
        "text": "Click on a row to see event details.",
        "options": {}
      },
      {
        "row": 0,
        "kind": "event",
        "title": "Event Details",
        "query": "`dmc_get_warnings_and_errors(dmc_group_kv_store, KVStore*)` punct=\"$warningErrorPunct$\" search_group=\"$group$\"",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "KV Store Status",
        "query": "| rest splunk_server_group=dmc_group_kv_store splunk_server_group=\"$group$\" /services/server/introspection/kvstore/serverstatus\n| eval Instance=splunk_server\n| spath input=data\n| eval network=round(abs(('network.bytesIn'+'network.bytesOut')/1024/1024), 2)\n| rename globalLock.lockTime AS globalLock, globalLock.totalTime AS total\n| eval lock=round(abs(globalLock*100/total), 2)\n| rename opcounters.command as c, opcounters.update as u, opcounters.queries as q, opcountes.deletes as d, opcounters.getmore as g, opcounters.inserts as i\n| eval totalops=if(isNotNull('c'), 'c',0)+if(isNotNull('u'), 'u', 0)+if(isNotNull('q'), 'q', 0)+if(isNotNull('d'), 'd', 0)+if(isNotNull('g'), 'g', 0)+if(isNotNull('i'), 'i', 0)\n| eval pf=round(abs('extra_info.page_faults'/totalops), 2)\n| eval flush='backgroundFlushing.last_ms'\n| eval hours=toString(round(uptime/3600, 2))\n| rename repl.ismaster as rstate\n| rename repl.secondary as secondary\n| eval replstate=if(rstate==\"true\", \"Primary\", if(secondary==\"true\", \"Secondary\", \"N/A\"))\n| stats first(mem.resident) AS \"Physical Memory Usage (MB)\" first(mem.mappedWithJournal) AS \"Mapped Memory Usage (MB)\" first(pf) AS \"Page Faults per Operation\" first(globalLock.currentQueue.total) AS \"Total Queued\" first(connections.current) AS \"Active Connections\" first(lock) AS \"Lock (%)\" first(flush) AS \"Last Flush (ms)\" first(network) AS \"Network Traffic (MB)\" first(hours) AS \"Uptime (hours)\"  first(replstate) AS \"Replication Role\" by Instance",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "KV Store Status",
        "query": "",
        "base": "",
        "text": "Click instance name for more details. Total queued is operations (readers and writers) waiting for a read or write lock to be cleared.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "viz",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n                    | eval server = host\n                    | rename data.opcounters.command as c, data.opcounters.update as u, data.opcounters.queries as q, data.opcountes.deletes as d, data.opcounters.getmore as g, data.opcounters.inserts as i | eval commands=if(isNotNull('c'), 'c',0)\n                    | eval totalops=if(isNotNull('c'), 'c',0)+if(isNotNull('u'), 'u', 0)+if(isNotNull('q'), 'q', 0)+if(isNotNull('d'), 'd', 0)+if(isNotNull('g'), 'g', 0)+if(isNotNull('i'), 'i', 0)\n                    | bin _time minspan=30s\n                    | stats latest(totalops) AS ops latest(data.extra_info.page_faults) AS pf by server _time\n                    | eval  percent=if(ops==0, 0, round(abs(pf/ops), 2))\n                    | bin _time minspan=30s\n                    | stats $countPageFaultsFunc$(percent) as percent by server _time\n                    | rangemap field=percent \"0-0.7\"=0-0.7 \"0.7-1.3\"=0.7001-1.3 \"1.3+\"=1.3001-999999 default=abnormal\n                    | timechart minspan=30s partial=f dc(server) as server_count by range\n                    | fields _time, \"1.3+\", \"0.7-1.3\", \"0-0.7\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n              | eval server = host\n              | rename data.opcounters.command as c, data.opcounters.update as u, data.opcounters.queries as q, data.opcountes.deletes as d, data.opcounters.getmore as g, data.opcounters.inserts as i | eval commands=if(isNotNull('c'), 'c',0)\n              | eval totalops=if(isNotNull('c'), 'c',0)+if(isNotNull('u'), 'u', 0)+if(isNotNull('q'), 'q', 0)+if(isNotNull('d'), 'd', 0)+if(isNotNull('g'), 'g', 0)+if(isNotNull('i'), 'i', 0)\n              | bin _time minspan=30s\n              | stats latest(totalops) AS ops latest(data.extra_info.page_faults) AS pf by server _time\n              | eval  percent=if(ops==0, 0, round(abs(pf/ops), 2))\n              | bin _time minspan=30s\n              | stats $countPageFaultsFunc$(percent) as percent by server _time\n              | rangemap field=percent \"0-0.7\"=0-0.7 \"0.7-1.3\"=0.7001-1.3 \"1.3+\"=1.3001-999999 default=abnormal\n              | timechart minspan=30s partial=f dc(server) as server_count by range\n              | fields _time, \"1.3+\", \"0.7-1.3\", \"0-0.7\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.fieldColors": "{\"1.3+\": 0xF7902B, \"0.7-1.3\": 0xFAC51C, \"0-0.7\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "`dmc_drilldown_kv_store_deployment_page_faults(\"$group$\", $countPageFaultsFunc$, $drilldown_page_fault_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Instances by $countPageFaultsFuncLabel$ Page Faults per Operation",
        "query": "",
        "base": "",
        "text": "Count of Splunk Enterprise instances grouped by $countPageFaultsFuncLabel$ page faults per operation over time.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Deployment-wide KV Store Network Traffic",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n| eval source=host\n| bin _time minspan=30s  \n| stats range(data.network.bytesIn) as indiff range(data.network.bytesOut) as outdiff by source _time\n| eval t=abs((indiff+outdiff)/1024/1024)\n| bin _time minspan=30s \n| stats sum(t) AS Traffic by _time  \n| timechart minspan=30s avg(Traffic) AS Traffic",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Total traffic (MB)",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Deployment-wide KV Store Network Traffic",
        "query": "`dmc_drilldown_kv_store_deployment_network(\"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Deployment-wide KV Store Network Traffic",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Deployment-wide KV Store Network Traffic",
        "query": "",
        "base": "",
        "text": "Total inbound and outbound network traffic attributed to the use of KV stores across all instances in the deployment.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "viz",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n                    | eval source=host\n                    | eval ratio='data.mem.virtual'/'data.mem.mappedWithJournal'\n                    | bin _time minspan=30s\n                    | stats avg(ratio) AS myratio by source _time\n                    | eval myratio = round(myratio, 2)\n                    | rangemap field=myratio \"0-2x\"=0-2 \"2-3x\"=2.001-3 \">3x\"=3.001-10000 default=abnormal\n                    | timechart minspan=30s partial=f dc(source) as server_count by range\n                    | fields _time \">3x\", \"2-3x\", \"0-2x\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n| eval source=host \n| eval ratio='data.mem.virtual'/'data.mem.mappedWithJournal' \n| bin _time minspan=30s \n| stats avg(ratio) AS myratio by source _time\n| eval myratio = round(myratio, 2)\n| rangemap field=myratio \"0-2x\"=0-2 \"2-3x\"=2.001-3 \">3x\"=3.001-10000 default=abnormal\n| timechart minspan=30s partial=f dc(source) as server_count by range\n| fields _time \">3x\", \"2-3x\", \"0-2x\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.fieldColors": "{\">3x\": 0xD85D3C, \"2-3x\": 0xF7902B, \"0-2x\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "`dmc_drilldown_kv_store_deployment_memory_ratio(\"$group$\", $drilldown_mapped_memory_ratio_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Instances by Virtual to Mapped Memory Ratio",
        "query": "",
        "base": "",
        "text": "Count of Splunk Enterprise instances grouped by ratio of virtual memory to mapped memory.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Instances by Average Replication Latency",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "viz",
        "title": "Instances by Average Replication Latency",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstorereplicasetstats data.replSetStats.myState=1\n                    | spath data.replSetStats.members{}.name output=name\n                    | spath data.replSetStats.members{}.optimeDate output=optimeDate\n                    | spath data.replSetStats.members{}.stateStr output=stateStr\n                    | eval prop_key_val=mvzip(mvzip(name, optimeDate, \"---\"), stateStr, \"---\")\n                    | fields _time, prop_key_val\n                    | mvexpand prop_key_val\n                    | eval name=mvindex(split(prop_key_val, \"---\"), 0)\n                    | eval optimeDate=mvindex(split(prop_key_val, \"---\"), 1)\n                    | eval stateStr=mvindex(split(prop_key_val, \"---\"), 2)\n                    | where stateStr=\"SECONDARY\"\n                    | join _time\n                    [ search `dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstorereplicasetstats data.replSetStats.myState=1\n                       | spath data.replSetStats.members{}.name output=name\n                       | spath data.replSetStats.members{}.optimeDate output=optimeDate\n                       | spath data.replSetStats.members{}.stateStr output=stateStr\n                       | eval prop_key_val=mvzip(mvzip(name, optimeDate, \"---\"), stateStr, \"---\")\n                       | fields _time, prop_key_val\n                       | mvexpand prop_key_val\n                       | eval name=mvindex(split(prop_key_val, \"---\"), 0)\n                       | eval optimeDate=mvindex(split(prop_key_val, \"---\"), 1)\n                       | eval stateStr=mvindex(split(prop_key_val, \"---\"), 2)\n                       | where stateStr=\"PRIMARY\"\n                       | stats max(optimeDate) as primary by _time]\n                    | eval difference=(primary-optimeDate)/1000\n                    | bin _time minspan=1m\n                    | stats avg(difference) AS lag by _time name\n                    | eval lag = round(lag, 2)\n                    | `dmc_replication_lag_rangemap`\n                    | timechart minspan=1m partial=f dc(name) as server_count by range\n                    | fields _time \">30s\", \"10-30s\", \"0-10s\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Instances by Average Replication Latency",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstorereplicasetstats data.replSetStats.myState=1\n            | spath data.replSetStats.members{}.name output=name\n            | spath data.replSetStats.members{}.optimeDate output=optimeDate\n            | spath data.replSetStats.members{}.stateStr output=stateStr\n            | eval prop_key_val=mvzip(mvzip(name, optimeDate, \"---\"), stateStr, \"---\")\n            | fields _time, prop_key_val\n            | mvexpand prop_key_val\n            | eval name=mvindex(split(prop_key_val, \"---\"), 0)\n            | eval optimeDate=mvindex(split(prop_key_val, \"---\"), 1)\n            | eval stateStr=mvindex(split(prop_key_val, \"---\"), 2)\n            | where stateStr=\"SECONDARY\"\n            | join _time\n            [ search `dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstorereplicasetstats data.replSetStats.myState=1\n                | spath data.replSetStats.members{}.name output=name\n                | spath data.replSetStats.members{}.optimeDate output=optimeDate\n                | spath data.replSetStats.members{}.stateStr output=stateStr\n                | eval prop_key_val=mvzip(mvzip(name, optimeDate, \"---\"), stateStr, \"---\")\n                | fields _time, prop_key_val\n                | mvexpand prop_key_val\n                | eval name=mvindex(split(prop_key_val, \"---\"), 0)\n                | eval optimeDate=mvindex(split(prop_key_val, \"---\"), 1)\n                | eval stateStr=mvindex(split(prop_key_val, \"---\"), 2)\n                | where stateStr=\"PRIMARY\"\n                | stats max(optimeDate) as primary by _time]\n            | eval difference=(primary-optimeDate)/1000\n            | bin _time minspan=1m\n            | stats avg(difference) AS lag by _time name\n            | eval lag = round(lag, 2)\n            | `dmc_replication_lag_rangemap`\n            | timechart minspan=1m partial=f dc(name) as server_count by range\n            | fields _time \">30s\", \"10-30s\", \"0-10s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.fieldColors": "{\">30s\": 0xD85D3C, \"10-30s\": 0xF7902B, \"0-10s\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Instances by Average Replication Latency",
        "query": "`dmc_drilldown_kv_store_deployment_replication_lag(\"$group$\", $drilldown_rep_latency_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Instances by Average Replication Latency",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Instances by Average Replication Latency",
        "query": "",
        "base": "",
        "text": "Count of Splunk Enterprise instances grouped by average latency of data replication between KV stores.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Operations Log Window of KV Store Captain",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstorereplicasetstats data.replSetStats.myState=1\n| eval source=host \n| bin _time minspan=1m  \n| rename data.oplogInfo.start as start, data.oplogInfo.end as end\n| eval diff=(end-start)/3600000\n| timechart minspan=1m avg(diff) AS hours",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Window (hours)",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Operations Log Window of KV Store Captain",
        "query": "`dmc_drilldown_kv_store_primary_oplog_window(\"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Operations Log Window of KV Store Captain",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Operations Log Window of KV Store Captain",
        "query": "",
        "base": "",
        "text": "Operations log window size is the length of time between the first and last operations in the oplog.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 10,
        "kind": "viz",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n                    | bin _time minspan=30s\n                    | stats range(data.backgroundFlushing.total_ms)  AS diff by _time host\n                    | timechart minspan=30s per_minute(diff) as ms_per_min by host\n                    | untable _time host ms_per_min\n                    | eval percent = round(ms_per_min / (60 * 1000) * 100, 2)\n                    | `dmc_background_flush_rangemap`\n                    | timechart minspan=30s partial=f dc(host) as server_count by range\n                    | fields _time, \"50-100%\", \"10-50%\", \"0-10%\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_kv_store search_group=\"$group$\" component=kvstoreserverstats\n| bin _time minspan=30s\n| stats range(data.backgroundFlushing.total_ms)  AS diff by _time host\n| timechart minspan=30s per_minute(diff) as ms_per_min by host\n| untable _time host ms_per_min\n| eval percent = round(ms_per_min / (60 * 1000) * 100, 2)\n| `dmc_background_flush_rangemap`\n| timechart minspan=30s partial=f dc(host) as server_count by range\n| fields _time, \"50-100%\", \"10-50%\", \"0-10%\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.fieldColors": "{\"50-100%\": 0xD85D3C, \"10-50%\": 0xF7902B, \"0-10%\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 10,
        "kind": "table",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "`dmc_drilldown_kv_store_deployment_background_flush(\"$group$\", $drilldown_background_flush_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Instances by Percent of Each Minute Spent Flushing to Disk",
        "query": "",
        "base": "",
        "text": "Percent is the percentage of 60 seconds KV Store takes to flush writes to disk.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Slowest Operations",
        "query": "`dmc_set_index_internal` search_group=dmc_group_kv_store search_group=\"$group$\" source=\"*mongod.log\" conn* *ms\n| rex field=_raw \"[^\\[]* (?<Operation>.*)\\s(?<ms>\\d+)ms\"\n| sort ms desc\n| head 10 \n| rename ms AS \"Duration (ms)\" \n\n| eval Instance=host\n| table \"Duration (ms)\" Instance _time Operation",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "093d393a77605e95869d8f077829ac0653d6abd70fa3f0e25cd044abc3fd4bf7"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "kv_store_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "kv_store_instance",
    "label": "KV Store: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_kv_store",
        "choices": [
          {
            "value": "dmc_group_kv_store",
            "label": "All KV Stores"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "table",
        "title": "Collection Metrics",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/collectionstats\n| mvexpand data\n| spath input=data\n| rex field=ns \"(?<App>.*)\\.(?<Collection>.*)\"\n| eval dbsize=round(size/1024/1024, 2)\n| eval indexsize=round(totalIndexSize/1024/1024, 2)\n| stats first(count) AS \"Number of Objects\" first(nindexes) AS Accelerations first(indexsize) AS \"Acceleration Size (MB)\" first(dbsize) AS \"Collection Size (MB)\" by App, Collection",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Memory Usage",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n          | spath input=data path=host output=host\n          | spath input=data path=mem output=mem_obj\n          | spath input=mem_obj\n          | fillnull virtual resident mappedWithJournal\n          | stats max(virtual) AS Virtual max(mappedWithJournal) AS Mapped max(resident) AS Resident by host",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.text": "Memory Usage (MB)",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Network Traffic",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| eval mbin='network.bytesIn'/1024/1024\n| eval mbout='network.bytesOut'/1024/1024\n| rename mbin AS \"MB In\", mbout AS \"MB Out\"\n| table  host \"MB In\" \"MB Out\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "1",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Network Traffic",
        "query": "",
        "base": "",
        "text": "Network traffic since restart.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Flush Time",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n          | spath input=data\n          | eval average=round('backgroundFlushing.average_ms'/1000, 3)\n          | eval last=round('backgroundFlushing.last_ms'/1000, 3)\n          | stats first(average) as average first(last) as last by splunk_server",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsX.majorLabelStyle.visibility": "collapsed",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.text": "Seconds",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Page Fault per Operation",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| rename opcounters.command as c, opcounters.update as u, opcounters.query as q, opcounters.delete as d, opcounters.getmore as g, opcounters.insert as i\n| eval totalops=if(isNotNull('c'), 'c',0)+if(isNotNull('u'), 'u', 0)+if(isNotNull('q'), 'q', 0)+if(isNotNull('d'), 'd', 0)+if(isNotNull('g'), 'g', 0)+if(isNotNull('i'), 'i', 0)\n| rename extra_info.page_faults as pf\n| eval percent=round(pf/totalops, 2)\n| stats first(percent)",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Percentage of Total Operations",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "radialGauge",
          "charting.gaugeColors": "[0x9AC23C,0xFAC51C,0xF7902B]",
          "charting.chart.rangeValues": "[\"0\",\"0.7\",\"1.3\",\"2\"]",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Operations",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| rename opcounters.command as command, opcounters.update as update, opcounters.query as query, opcounters.delete as delete, opcounters.getmore as getmore, opcounters.insert as insert\n| table host command update query delete getmore insert",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "1",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Operations",
        "query": "",
        "base": "",
        "text": "KV store operations since last restart.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "single",
        "title": "KV Store Status",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| stats values(connections.current)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Active connections",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "KV Store Status",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| stats values(globalLock.currentQueue.total)",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "underLabel": "Total Queues",
          "height": "80px"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "KV Store Status",
        "query": "| rest splunk_server=$splunk_server$ /services/server/introspection/kvstore/serverstatus\n| spath input=data\n| eval asserts='asserts.msg' +'asserts.regular' +'asserts.rollovers' +'asserts.user' +'asserts.warning'\n| stats first(asserts)",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "underLabel": "Total Asserts",
          "height": "80px"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Memory Usage",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| timechart minspan=30s avg(data.mem.virtual) AS Virtual avg(data.mem.mappedWithJournal) AS Mapped avg(data.mem.resident) AS Resident",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Memory Usage (MB)",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Operations per Minute",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n          | bin _time minspan=30s\n          | stats first(data.opcounters.command) AS command first(data.opcounters.update) as update first(data.opcounters.query) as query first(data.opcounters.delete) as delete first(data.opcounters.getmore) as getmore first(data.opcounters.insert) as insert by _time\n          | streamstats window=2 range(*) as r_*\n          | timechart minspan=30s per_minute(r_*) AS original_*\n          | rename original_* as *\n          | fields _time $operationToChart$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Asserts",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n          | bin _time minspan=30s\n          | stats first(data.asserts.msg) AS msg first(data.asserts.regular) as regular first(data.asserts.rollovers) as rollovers first(data.asserts.user) as user first(data.asserts.warning) as warning by _time\n          | streamstats window=2 range(*) as r_*\n          | timechart minspan=30s per_minute(r_*) AS original_*\n          | rename original_* as *\n          | fields _time $assertType$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Page Faults per Operation",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| rename data.opcounters.command as c, data.opcounters.update as u, data.opcounters.queries as q, data.opcountes.deletes as d, data.opcounters.getmore as g, data.opcounters.inserts as i\n| eval totalops=if(isNotNull('c'), 'c',0)+if(isNotNull('u'), 'u', 0)+if(isNotNull('q'), 'q', 0)+if(isNotNull('d'), 'd', 0)+if(isNotNull('g'), 'g', 0)+if(isNotNull('i'), 'i', 0)\n| bin minspan=30s _time\n| stats first(totalops) as total first(data.extra_info.page_faults) as faults by _time\n| eval percent=round(faults/total, 2)\n| timechart minspan=30s avg(percent) AS \"Page Faults per Operation\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Ratio",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Network Traffic",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| bin minspan=30s _time\n| stats first(data.network.bytesIn) as bytesIn first(data.network.bytesOut) as bytesOut by _time\n| streamstats window=2 range(*) as *\n| eval in=abs(bytesIn/1024/1024)\n| eval out=abs(bytesOut/1024/1024)\n| timechart minspan=30s per_minute(in) AS \"MB/min In\" per_minute(out) AS \"MB/min Out\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "MB",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Size of Queues",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| bin _time minspan=30s\n| timechart median(data.globalLock.currentQueue.total) AS Total median(data.globalLock.currentQueue.readers) AS Readers median(data.globalLock.currentQueue.writers) AS Writers",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Connections over Time",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| bin _time minspan=30s\n| timechart median(data.connections.current) as Connections",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Percent of Each Minute Spent Flushing to Disk",
        "query": "`dmc_set_index_introspection` host=$host$ component=kvstoreserverstats\n| bin minspan=30s _time\n| stats first(data.backgroundFlushing.total_ms) as flush by _time\n| streamstats window=2 range(flush) as flush\n| eval seconds=flush/1000\n| timechart minspan=30s per_minute(seconds) AS percent\n| eval Percent = round(percent / 60 * 100, 2)\n| fields - percent",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Percent",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 13,
        "kind": "table",
        "title": "Slowest Operations",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=\"mongod\" \"[conn*\"\n| rex field=_raw \"\\[conn\\d+\\]\\s+(?<Operation_type>\\w+)\\s+(?<Operation>.*)\\s+(?<duration>\\d+)ms$\"\n| where isnotnull(Operation) AND (duration > 0)\n| sort 100 - duration\n| rename duration AS \"Duration (ms)\"\n| table _time Operation \"Duration (ms)\"",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "21575f0ef578efd69e6d852f6fa0d7c871ca3c143c499d91ed5cf08ae0e2dd5a"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "license_usage_30days.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "license_usage_historic",
    "label": "Historic License Usage",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "License Managers",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "pool",
        "label": "Pool",
        "default": "All Pools",
        "choices": [
          {
            "value": "*",
            "label": "All Pools"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "split_by",
        "label": "Split By",
        "default": "No Split",
        "choices": [
          {
            "value": "No Split",
            "label": "No split"
          },
          {
            "value": "Pool",
            "label": "By pool"
          },
          {
            "value": "Indexer",
            "label": "By indexer"
          },
          {
            "value": "Source Type",
            "label": "By source type"
          },
          {
            "value": "Host",
            "label": "By host"
          },
          {
            "value": "Source",
            "label": "By source"
          },
          {
            "value": "Index",
            "label": "By index"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "chart",
        "title": "Daily License Usage",
        "query": "`$base_search$($host$,\"$pool$\")` | `$exclude_itsi_pools$($host$, pool)` | `$daily_usage_search$($splunk_server$, $size_search$, $host$, \"$pool$\", \"$split_by_field_name$\")` $overlay_remove$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "GB",
          "charting.axisTitleX.text": "Date",
          "charting.chart.overlayFields": "\"stack size\",\"pool size\"",
          "charting.lineDashStyle": "ShortDash",
          "charting.chart.stackMode": "stacked",
          "charting.fieldColors": "{\"stack size\": 0xff0000, \"pool size\": 0xff0000}",
          "charting.chart.nullValueMode": "connect"
        }
      },
      {
        "row": 1,
        "kind": "chart",
        "title": "Percentage of Daily License Quota Used",
        "query": "`$base_search$($host$,\"$pool$\")` | `$exclude_itsi_pools$($host$, pool)` | `$daily_usage_pct_search$($splunk_server$, $sz_clause$, $host$, \"$split_by_field_name$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "%",
          "charting.axisTitleX.text": "Date",
          "charting.chart.stackMode": "stacked"
        }
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Average and Peak Daily Volume",
        "query": "`$base_search$($host$,\"$pool$\")` | `$exclude_itsi_pools$($host$, pool)` | `$max_avg_search$($splunk_server$, \"$split_by_field_name$\", \"$split_by$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "GB",
          "charting.legend.labelStyle.overflowMode": "ellipsisEnd"
        }
      }
    ],
    "sourceSha256": "8c5237f2903b2eda7b4b1889867fc545948f2ec32645141da1203cf6e7709f0d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "license_usage_today.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "license_usage_today",
    "label": "License Usage - Today",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "License Managers",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "chart",
        "title": "Today's License Usage (GB)",
        "query": "| rest splunk_server=$splunk_server$ /services/licenser/pools | rename title AS Pool | `dmc_license_non_itsi_pools($splunk_server$, Pool)` | search [rest splunk_server=$splunk_server$ /services/licenser/groups | search is_active=1 | eval stack_id=stack_ids | fields stack_id] | join type=outer stack_id [rest splunk_server=$splunk_server$ /services/licenser/stacks | eval stack_id=title | eval stack_quota=quota | fields stack_id stack_quota] | stats sum(used_bytes) as used max(stack_quota) as total | eval usedGB=round(used/1024/1024/1024,3) | eval totalGB=round(total/1024/1024/1024,3) | eval gauge_base=0 | eval gauge_danger=totalGB*0.8 | eval gauge_top=totalGB+0.001 | gauge usedGB gauge_base gauge_danger totalGB gauge_top",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "fillerGauge",
          "refresh.time.visible": "true"
        }
      },
      {
        "row": 0,
        "kind": "chart",
        "title": "Today's License Usage per Pool",
        "query": "| rest splunk_server=$splunk_server$ /services/licenser/pools | rename title AS Pool | `dmc_license_non_itsi_pools($splunk_server$, Pool)` | search [rest splunk_server=$splunk_server$ /services/licenser/groups | search is_active=1 | eval stack_id=stack_ids | fields stack_id] | eval quota=if(isnull(effective_quota),quota,effective_quota) | eval \"Used\"=round(used_bytes/1024/1024/1024, 3) | eval \"Quota\"=round(quota/1024/1024/1024, 3) | fields Pool \"Used\" \"Quota\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "refresh.time.visible": "true",
          "charting.axisTitleX.text": "Pool",
          "charting.axisTitleY.text": "GB"
        }
      },
      {
        "row": 0,
        "kind": "chart",
        "title": "Today's Percentage of Daily License Quota Used per Pool",
        "query": "| rest splunk_server=$splunk_server$ /services/licenser/pools | rename title AS Pool | `dmc_license_non_itsi_pools($splunk_server$, Pool)` | search [rest splunk_server=$splunk_server$ /services/licenser/groups | search is_active=1 | eval stack_id=stack_ids | fields stack_id] | eval quota=if(isnull(effective_quota),quota,effective_quota) | eval \"% used\"=round(used_bytes/quota*100,2) | fields Pool \"% used\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "refresh.time.visible": "true",
          "charting.axisTitleX.text": "Pool",
          "charting.axisTitleY.text": "%",
          "charting.legend.placement": "none",
          "charting.axisY.scale": "log"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Pool Usage Warnings",
        "query": "| rest splunk_server=$splunk_server$ /services/licenser/messages | where (category==\"license_window\" OR category==\"pool_over_quota\") AND create_time >= now() - (30 * 86400) | rename pool_id AS pool | eval warning_day=if(category==\"pool_over_quota\",\"(\".strftime(create_time,\"%B %e, %Y\").\")\",strftime(create_time-43200,\"%B %e, %Y\")) | fields pool warning_day | join outer pool [rest splunk_server=$splunk_server$ /services/licenser/slaves | mvexpand active_pool_ids | eval slave_name=label | eval pool=active_pool_ids | fields pool slave_name | stats values(slave_name) as \"members\" by pool] | join outer pool [rest splunk_server=$splunk_server$ /services/licenser/pools | eval pool=title | eval quota=if(isnull(effective_quota),quota,effective_quota) | eval quotaGB=round(quota/1024/1024/1024,3) | fields pool stack_id, quotaGB] | stats first(pool) as \"Pool\" first(stack_id) as \"Stack ID\" first(members) as \"Current Members\" first(quotaGB) as \"Curent Quota (GB)\" values(warning_day) AS \"Warning Days - (Soft)/Hard\" by pool | fields - pool",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Slave Usage Warnings",
        "query": "| rest splunk_server=$splunk_server$ /services/licenser/slaves | mvexpand active_pool_ids | where warning_count>0 | eval pool=active_pool_ids | join type=outer pool [rest splunk_server=$splunk_server$ /services/licenser/pools | eval pool=title | fields pool stack_id] | eval in_violation=if(warning_count>4 OR (warning_count>2 AND stack_id==\"free\"),\"yes\",\"no\") | fields label, title, pool, warning_count, in_violation | fields - _timediff | rename label as \"Slave\" title as \"GUID\" pool as \"Pool\" warning_count as \"Hard Warnings\" in_violation AS \"In Violation?\"",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "06af6fd5c13e9112de7467d2dd4b3d3d022e0ee3f39b387cc2d15e47fb048b62"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_alerts_setup.prod_lite",
    "label": "Platform Alerts Setup",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "2837df490fb19bcd2c4c92512aae55b94de0d12f480d1f2aa4747a7af9412bed"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_alerts_setup",
    "label": "Alerts Setup",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "537e251c1bdfeac79d33e238b8c3a814655f9deabb7524d71f900d33fe7d67d3"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_check.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_check",
    "label": "Health Check",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "7efe8c751c7dab46637f6cc1b961c03e1c195e3bb2ff12c9a0e2ecb3a5dbb849"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_check_list.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_check_list",
    "label": "Health Check Items",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "35239a2324bc42ee3e7b2e01065252c4d603b2a1befa4cfff31538195b54c016"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_configure.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_configure",
    "label": "General Setup",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a34e348fc94727be172978a68d196364d10ad33c49db491de66882880ed23de7"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_forwarder_setup",
    "label": "Forwarder Monitoring Setup",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "8746032dcd307637cae8a01d61d79ab394b9165c2e03e130ade4515ba0c16098"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_instances.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_instances",
    "label": "Instances",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "4cbb183ca46669094cfb13bae7dc0e44efcdc3f88246a6048f5e55387e6d8891"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_landing.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_landing",
    "label": "Summary",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a7d85d53c0b16ffc3b710b8946b4d0466d5e5d7dd3aed5f809222d164c26f31d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_overview.env_cloud",
    "label": "Overview",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Today's License Usage (GB)",
        "query": "| rest splunk_server=local /services/licenser/usage\n            | eval usedGB=round(slaves_usage_bytes/1024/1024/1024,3)\n            | eval totalGB=round(quota/1024/1024/1024,3)\n            | eval gauge_base=0\n            | eval gauge_danger=totalGB*0.8\n            | gauge usedGB gauge_base gauge_danger totalGB",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "fillerGauge",
          "refresh.time.visible": "true"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Today's Percentage of Daily License Quota used",
        "query": "| rest splunk_server=local /services/licenser/usage\n            | eval percent = ((slaves_usage_bytes/quota)*100)\n            | fields percent",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "used",
          "afterLabel": "%",
          "refresh.time.visible": "false",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Indexing Overview",
        "query": "| rest splunk_server=local /services/server/introspection/indexer\n            | eval average_KBps = round(average_KBps, 0)\n            | stats sum(average_KBps)",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "Total Indexing Rate",
          "afterLabel": "KB/s",
          "refresh.time.visible": "false",
          "refresh.auto.interval": "60",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Search Activity",
        "query": "| rest splunk_server=local /services/server/status/resource-usage/splunk-processes\n          | search search_props.sid=*\n          | stats dc(search_props.sid) AS count by search_props.$resourceSnapshotSplitBy$\n          | sort -count\n          | rename count as \"Count of Searches\", search_props.$resourceSnapshotSplitBy$ as $resourceSnapshotSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "table",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Count",
          "charting.axisTitleY.text": "Count",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Search Activity",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Daily License Usage",
        "query": "",
        "base": "",
        "text": "The report that powers these panels is not accelerated.  For faster performance, you might wish to turn on acceleration for this report. Learn more",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Daily License Usage",
        "query": "",
        "base": "",
        "text": "$split_by_info_msg$",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Daily License Usage",
        "query": "splunk_server=local `$base_search$($host$,\"$pool$\")` | `$daily_usage_search$($splunk_server$, $size_search$, $host$, \"$split_by_field_name$\", \"$pool$\")` $overlay_remove$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "GB",
          "charting.axisTitleX.text": "Date",
          "charting.chart.overlayFields": "\"stack size\",\"pool size\"",
          "charting.lineDashStyle": "ShortDash",
          "charting.chart.stackMode": "stacked",
          "charting.fieldColors": "{\"stack size\": 0xff0000, \"pool size\": 0xff0000}",
          "charting.chart.nullValueMode": "connect"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Percentage of Daily License Quota Used",
        "query": "splunk_server=local `$base_search$($host$,\"$pool$\")` | `$daily_usage_pct_search$($splunk_server$, $sz_clause$, $host$, \"$split_by_field_name$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "%",
          "charting.axisTitleX.text": "Date",
          "charting.chart.stackMode": "stacked"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Estimated Indexing Rate Per $groupTypeIdxPerf$",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=splunkd group=per_$groupTypeIdxPerf$_thruput\n          | `dmc_timechart_for_metrics_log` per_second(kb) by series useother=false limit=15",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Indexing Rate (KB/s)",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "$concurrencyFuncLabel$ Search Concurrency",
        "query": "`dmc_set_index_introspection` splunk_server=local sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n          | `dmc_rename_introspection_fields`\n          | `dmc_set_bin`\n          | stats dc(sid) AS distinct_search_count by _time, $concurrencySplitBy$\n          | `dmc_timechart` $concurrencyFunction$(distinct_search_count) AS \"$concurrencyFunction$ of search concurrency\" by $concurrencySplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "$concurrencyFuncLabel$ Search Concurrency",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 12,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "a19a16d665f3fd03d24bc77536dfdca262ec62b4826d02720a853988e6309105"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_overview.prod_lite",
    "label": "Resource Usage",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 1,
        "kind": "single",
        "title": "Indexing Rate",
        "query": "| rest /services/server/introspection/indexer\n| eval average_KBps = round(average_KBps, 0)\n| stats sum(average_KBps)",
        "base": "",
        "text": "",
        "options": {
          "afterLabel": "KB/s",
          "refresh.time.visible": "false",
          "refresh.auto.interval": "30",
          "height": "200px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Data Volume Indexed Today",
        "query": "| rest splunk_server=local /services/licenser/usage\n| eval used=round(slaves_usage_bytes/1024/1024/1024,1)\n| eval quota=round(quota/1024/1024/1024,1)\n| eval fullFlavor = used.\"/\".quota\n| fields fullFlavor",
        "base": "",
        "text": "",
        "options": {
          "afterLabel": "GB",
          "refresh.time.visible": "true",
          "refresh.auto.interval": "30",
          "height": "200px"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Search Concurrency",
        "query": "| rest /services/server/status/resource-usage/splunk-processes\n| search search_props.sid=*\n| stats count(search_props.type) as Count, sum(mem_used) as \"Memory Usage(MB)\", sum(normalized_pct_cpu) as \"CPU Usage(%)\" by search_props.type\n| rename search_props.type as Type",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "table",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Count",
          "charting.axisTitleY.text": "Count",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "height": "200px"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Indexing Rate by Time",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=per_Index_thruput\n| `dmc_timechart_for_metrics_log` per_second(kb) by series useother=false\n| fields - VALUE_*\n| addtotals\n| eval Total = round(Total,2)\n| fields _time, Total",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Indexing Rate (KB/s)",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Daily Indexed Data Volume by Time",
        "query": "index=_internal source=*license_usage.log* type=\"Usage\" earliest=$time$ latest=@d\n| eval _time=_time - 43200\n| eval h=if(len(h)=0 OR isnull(h),\"(SQUASHED)\",h)\n| eval s=if(len(s)=0 OR isnull(s),\"(SQUASHED)\",s)\n| eval idx=if(len(idx)=0 OR isnull(idx),\"(UNKNOWN)\",idx)\n| bin _time span=1d\n| stats sum(b) as b by _time, pool, s, st, h, idx\n| append [ rest /services/licenser/usage/license_usage\n| stats sum(slaves_usage_bytes) as b\n| eval _time=relative_time(now(), \"@d\")]\n| eval GB=round(b/1024/1024/1024, 2)\n| timechart span=1d sum(GB) AS \"GB indexed\"\n| eval \"Sum GB\" = round(GB,2)\n| fields - _timediff",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "refresh.time.visible": "true",
          "charting.axisTitleY.text": "Indexed Data (GB)",
          "charting.axisTitleX.text": "Time",
          "charting.chart.overlayFields": "\"stack size\",\"pool size\"",
          "charting.lineDashStyle": "ShortDash",
          "charting.chart.stackMode": "stacked",
          "charting.fieldColors": "{\"stack size\": 0xff0000, \"pool size\": 0xff0000}",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Search Concurrency by Time",
        "query": "index=_internal source=*metrics.log group=search_concurrency user=*\n| eval total = active_hist_searches + active_realtime_searches\n| timechart max(total) by user agg=max useother=f\n| fields - splunk-system-user\n| addtotals\n| fields _time, Total",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count of Searches"
        }
      }
    ],
    "sourceSha256": "8a7e130762cecdc7baef96b0034208441558e92f288fa4c85e49bafcd1ecf12e"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_overview",
    "label": "Overview",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "c97fea4852ab47b2caffed5720c20c0300e8db5f0adc5d963a48716ffaa26787"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_overview_preferences.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "monitoringconsole_overview_preferences",
    "label": "Overview Preferences",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "b452db76b18d8f0be874d5e7a586fa4f265333bcf417a354cd2ad65c0e2f081f"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "reports.prod_lite",
    "label": "Reports",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "68f80cf680d9d101ba19758bf4ee1de30dc18347d9147e44f4424d6f0103ae40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "reports",
    "label": "Reports",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "0cded6b4ea9eebe57d8a9a081d03145623d40310430fbbb122454c377ac19b80"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_cpu_deployment",
    "label": "CPU Usage: Deployment",
    "description": "This dashboard consolidates panels from other Monitoring Console dashboards to help you assess the CPU usage of your Splunk deployment.",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "role_token",
        "label": "Role",
        "default": "",
        "choices": [
          {
            "value": "sh_and_idx",
            "label": "Search-heads and Indexers"
          },
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Effective CPU",
        "query": "| stats avg(cpu_usage) AS cpu_usage\n            | eval cpu_usage = round(cpu_usage, 2).\"%\"",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Average CPU usage across all instances"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Effective CPU",
        "query": "| stats sum(virtual_cpu_count)",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Total allocated vCPU"
        }
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "CPU per Primary Server Role",
        "query": "| `dmc_get_primary_role`\n            | stats sum(virtual_cpu_count) by primary_role",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "charting.chart": "pie"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Search Heads",
        "query": "| where role = \"search_head\"\n            | stats avg(cpu_usage) AS cpu_usage\n            | eval cpu_usage = round(cpu_usage, 2).\"%\"",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "CPU Usage Avg"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Search Heads",
        "query": "| where role = \"search_head\"\n            | stats median(virtual_cpu_count)",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Median vCPU count per instance"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Search Heads",
        "query": "| stats dc(splunk_server) AS instance_count by role\n            | where role = \"search_head\"\n            | fields instance_count",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Instance count"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Indexers",
        "query": "| where role = \"indexer\"\n            | stats avg(cpu_usage) AS cpu_usage\n            | eval cpu_usage = round(cpu_usage, 2).\"%\"",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "CPU Usage Avg"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Indexers",
        "query": "| where role = \"indexer\"\n            | stats median(virtual_cpu_count)",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Median vCPU count per instance"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Indexers",
        "query": "| stats dc(splunk_server) AS instance_count by role\n            | where role = \"indexer\"\n            | fields instance_count",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {
          "underLabel": "Instance count"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "CPU Usage by Instance",
        "query": "| fields splunk_server, role, core_info, cpu_usage, normalized_load_avg_1min\n            | `dmc_pretty_print_role(role)`\n            | sort - cpu_usage\n            | rename splunk_server AS Instance, role as Role, normalized_load_avg_1min AS \"Load Average\", core_info AS \"CPU Cores (Physical / Virtual)\", cpu_usage AS \"CPU Usage (%)\"",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "CPU Usage by Primary Server Role over Splunk Process Type",
        "query": "",
        "base": "system_cpu_usage",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "bar",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisLabelsX.majorLabelVisibility": "show",
          "charting.axisLabelsX2.axisVisibility": "show",
          "charting.axisY.minimumNumber": "0",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "CPU Usage by Primary Server Role over Splunk Process Type",
        "query": "",
        "base": "system_cpu_usage",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "bar",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisLabelsX.majorLabelVisibility": "show",
          "charting.axisLabelsX2.axisVisibility": "show",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Deployment-Wide $avgCPUFuncLabel$ CPU Usage",
        "query": "| `dmc_set_bin`\n            | stats latest(total_cpu_usage) as dedup_total_cpu_usage by host _time\n            | `dmc_timechart` $avgCPUFunc$(dedup_total_cpu_usage) as cpu_usage",
        "base": "base_cpu_usage",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.majorUnit": "20",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "| timechart minspan=10s bins=200 partial=f $countCPUFunc$(total_cpu_usage) as cpu_usage by host",
        "base": "base_cpu_usage",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"100%+\": 0x956D95, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "| eval server = host\n            | `dmc_set_bin_for_timechart`\n            | stats $countCPUFunc$(total_cpu_usage) as cpu_usage by server _time\n            | `dmc_cpu_usage_rangemap_and_timechart`",
        "base": "base_cpu_usage",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"100%+\": 0x956D95, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "`dmc_drilldown_resource_usage_cpu_deployment_usage(\"$role$\", \"$group$\", $role_post_filter$, $countCPUFunc$, $drilldown_cpu_usage_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "",
        "base": "cpu_by_process_class",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "",
        "base": "cpu_by_process_class",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked100",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Share of CPU Usage"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage of Searches",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" $role_post_filter$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | stats latest(normalized_pct_cpu) AS resource_usage_dedup by _time, $resourceSplitBy$, sid, pid\n        | stats sum(resource_usage_dedup) AS sum_resource_usage by _time,  $resourceSplitBy$\n        | eval sum_resource_usage = round(sum_resource_usage / 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_resource_usage) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "CPU Usage (# cores)"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "$resourceFuncLabel$ CPU Usage of Searches",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "$histFuncLabel$ Historical CPU Usage",
        "query": "| mstats $histFunc$(\"spl.intr.resource_usage.Hostwide.data.cpu_system_pct_mrollup_avg_86400s\")  $histFunc$(\"spl.intr.resource_usage.Hostwide.data.cpu_user_pct_mrollup_avg_86400s\") prestats=true WHERE \"index\"=\"_metrics_rollup\" by extracted_host span=1h\n          | rename extracted_host as host\n          | lookup dmc_assets host OUTPUT search_group\n          | where $role_post_filter$ $metric_search_group$\n          | timechart eval($histFunc$('spl.intr.resource_usage.Hostwide.data.cpu_user_pct_mrollup_avg_86400s') + $histFunc$('spl.intr.resource_usage.Hostwide.data.cpu_system_pct_mrollup_avg_86400s')) by host\n          | fields - _span",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "none",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "CPU Usage %"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "$histFuncLabel$ Historical CPU Usage",
        "query": "",
        "base": "",
        "text": "To view data in this panel you must enable the metric rollup policy specified in the [index:_metrics] stanza in metric_rollups.conf. Learn More",
        "options": {}
      }
    ],
    "sourceSha256": "4282d8cb5121c6f43cb3738df30afba5b1edd5302f8062fd686e332821e90ef9"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_cpu_instance",
    "label": "CPU Usage: Instance",
    "description": "This dashboard consolidates panels from other Monitoring Console dashboards to help you assess the CPU usage of a Splunk instance.",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "role",
        "label": "Role",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "CPU Usage",
        "query": "| fields splunk_server, role, core_info, cpu_usage, normalized_load_avg_1min\n            | `dmc_pretty_print_role(role)`\n            | sort - cpu_usage\n            | rename splunk_server AS Instance, role as Role, normalized_load_avg_1min AS \"Load Average\", core_info AS \"CPU Cores (Physical / Virtual)\", cpu_usage AS \"CPU Usage (%)\"",
        "base": "instance_cpu_usage",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "CPU Usage over Splunk Process Type",
        "query": "",
        "base": "system_cpu_usage",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "bar",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisLabelsX.majorLabelVisibility": "show",
          "charting.axisLabelsX2.axisVisibility": "show",
          "charting.axisY.minimumNumber": "0",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "CPU Usage over Splunk Process Type",
        "query": "",
        "base": "system_cpu_usage",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "bar",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisLabelsX.majorLabelVisibility": "show",
          "charting.axisLabelsX2.axisVisibility": "show",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "",
        "base": "cpu_by_process_class",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "",
        "base": "cpu_by_process_class",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage of Searches",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | stats latest(normalized_pct_cpu) AS resource_usage_dedup by _time, $resourceSplitBy$, sid, pid\n        | stats sum(resource_usage_dedup) AS sum_resource_usage by _time,  $resourceSplitBy$\n        | eval sum_resource_usage = round(sum_resource_usage / 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_resource_usage) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "CPU Usage (# cores)"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "$resourceFuncLabel$ CPU Usage of Searches",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$histFuncLabel$ Historical CPU Usage",
        "query": "| mstats $histFunc$(\"spl.intr.resource_usage.Hostwide.data.cpu_system_pct_mrollup_avg_86400s\")  $histFunc$(\"spl.intr.resource_usage.Hostwide.data.cpu_user_pct_mrollup_avg_86400s\") prestats=true WHERE \"index\"=\"_metrics_rollup\" by extracted_host span=1h\n          | rename extracted_host as host\n          | where host=\"$host$\"\n          | timechart eval($histFunc$('spl.intr.resource_usage.Hostwide.data.cpu_user_pct_mrollup_avg_86400s') + $histFunc$('spl.intr.resource_usage.Hostwide.data.cpu_system_pct_mrollup_avg_86400s')) by host\n          | fields - _span",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "none",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "CPU Usage %"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "$histFuncLabel$ Historical CPU Usage",
        "query": "",
        "base": "",
        "text": "To view data in this panel you must enable the metric rollup policy specified in the [index:_metrics] stanza in metric_rollups.conf. Learn More",
        "options": {}
      }
    ],
    "sourceSha256": "489e0c216c76ad1696d136b154ed67371d7d80b8f5314466c707718c773d44d5"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_deployment",
    "label": "Resource Usage: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "role",
        "label": "Role",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Resource Usage by Instance",
        "query": "| rest splunk_server_group=$role$ splunk_server_group=\"$group$\" /services/server/status/resource-usage/hostwide\n| join type=outer splunk_server [\n  | rest splunk_server_group=$role$ splunk_server_group=\"$group$\" /services/server/status/resource-usage/iostats\n  | eval iops = round(reads_ps + writes_ps)\n  | eval iops_mountpoint = iops.\" (\".mount_point.\")\"\n  | eval cpupct_mountpoint = cpu_pct.\"% (\".mount_point.\")\"\n  | stats values(iops_mountpoint) as iops_mountpoint, values(cpupct_mountpoint) as cpupct_mountpoint by splunk_server]\n| eventstats min(eval(if(isnull(normalized_load_avg_1min), \"0\", \"1\"))) as _load_avg_full_availability\n| eval normalized_load_avg_1min = if(isnull(normalized_load_avg_1min), \"N/A\", normalized_load_avg_1min)\n| eval core_info = if(isnull(cpu_count), \"N/A\", cpu_count).\" / \".if(isnull(virtual_cpu_count), \"N/A\", virtual_cpu_count)\n| eval cpu_usage = cpu_system_pct + cpu_user_pct\n| eval mem_used_pct = round(mem_used / mem * 100 , 2)\n| eval mem_used = round(mem_used, 0)\n| eval mem = round(mem, 0)\n| fields splunk_server, normalized_load_avg_1min, core_info, cpu_usage, mem, mem_used, mem_used_pct, iops_mountpoint, cpupct_mountpoint\n| sort - cpu_usage, -mem_used\n| rename splunk_server AS Instance, normalized_load_avg_1min AS \"Load Average\", core_info AS \"CPU Cores (Physical / Virtual)\", cpu_usage AS \"CPU Usage (%)\", mem AS \"Physical Memory Capacity (MB)\", mem_used AS \"Physical Memory Usage (MB)\", mem_used_pct AS \"Physical Memory Usage (%)\", iops_mountpoint as \"I/O Operations per second (Mount Point)\", cpupct_mountpoint as \"Storage I/O Saturation (Mount Point)\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Resource Usage by Instance",
        "query": "",
        "base": "",
        "text": "Click on instance name for more details.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "viz",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n                    | eval server = host\n                    | `dmc_set_bin_for_timechart`\n                    | stats $countLoadAvgFunc$(data.normalized_load_avg_1min) as load_average by server _time\n                    | `dmc_load_average_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval server = host \n| `dmc_set_bin_for_timechart`\n| stats $countLoadAvgFunc$(data.normalized_load_avg_1min) as load_average by server _time\n| `dmc_load_average_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"1.5+\": 0xD85D3C, \"0.75-1.5\": 0xF7902B, \"0-0.75\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "`dmc_drilldown_resource_usage_deployment_load_average(\"$role$\", \"$group$\", $countLoadAvgFunc$, $drilldown_load_average_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $countLoadAvgFuncLabel$ machine-wide load average over time.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "$loadAvgFuncLabel$ machine-wide load average over time by instance.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "$countLoadAvgFuncLabel$ load average metric is not supported on Windows and will not be shown for instances running on that operating system.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n|`dmc_timechart` partial=f limit=25 $countLoadAvgFunc$(data.normalized_load_avg_1min) AS load_average by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Load Average"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $countLoadAvgFuncLabel$ machine-wide load average over time.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "$loadAvgFuncLabel$ machine-wide load average over time by instance.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "$countLoadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "$countLoadAvgFuncLabel$ load average metric is not supported on Windows and will not be shown for instances running on that operating system.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Deployment-Wide $loadAvgFuncLabel$ Load Average",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval server = host\n| `dmc_set_bin`\n| stats latest(data.normalized_load_avg_1min) as dedup_load_average by server _time\n| `dmc_timechart` $loadAvgFunc$(dedup_load_average) as load_average",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Load Average"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Deployment-Wide $loadAvgFuncLabel$ Load Average",
        "query": "",
        "base": "",
        "text": "Deployment-Wide $loadAvgFuncLabel$ Load Average is not supported on Windows and will not be shown for instances running on that operating system.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "html",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "viz",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n                    | eval total_cpu_usage = 'data.cpu_system_pct' + 'data.cpu_user_pct'\n                    | eval server = host\n                    | `dmc_set_bin_for_timechart`\n                    | stats $countCPUFunc$(total_cpu_usage) as cpu_usage by server _time\n                    | `dmc_cpu_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval total_cpu_usage = 'data.cpu_system_pct' + 'data.cpu_user_pct' \n| eval server = host \n| `dmc_set_bin_for_timechart`\n| stats $countCPUFunc$(total_cpu_usage) as cpu_usage by server _time\n| `dmc_cpu_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"100%+\": 0x956D95, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 6,
        "kind": "table",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "`dmc_drilldown_resource_usage_deployment_cpu_usage(\"$role$\", \"$group$\", $countCPUFunc$, $drilldown_cpu_usage_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval total_cpu_usage = 'data.cpu_system_pct' + 'data.cpu_user_pct'\n|`dmc_timechart` partial=f limit=25 $countCPUFunc$(total_cpu_usage) AS cpu_usage by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"100%+\": 0x956D95, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $countCPUFuncLabel$ machine-wide CPU usage over time.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "$countCPUFuncLabel$ CPU Usage",
        "query": "",
        "base": "",
        "text": "$countCPUFuncLabel$ machine-wide CPU usage over time by instance.",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Deployment-Wide $avgCPUFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval total_cpu_usage = ('data.cpu_system_pct' + 'data.cpu_user_pct')\n| eval server = host\n| `dmc_set_bin`\n| stats latest(total_cpu_usage) as dedup_total_cpu_usage by server _time\n| `dmc_timechart` $avgCPUFunc$(dedup_total_cpu_usage) as cpu_usage",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.majorUnit": "20",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "viz",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n                    | eval pct_mem_used = 'data.mem_used' / 'data.mem'\n                    | eval server = host\n                    | `dmc_set_bin_for_timechart`\n                    | stats $countMemFunc$(pct_mem_used) as pct_mem_used by server _time\n                    | `dmc_memory_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval pct_mem_used = 'data.mem_used' / 'data.mem' \n| eval server = host \n| `dmc_set_bin_for_timechart`\n| stats $countMemFunc$(pct_mem_used) as pct_mem_used by server _time\n| `dmc_memory_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "`dmc_drilldown_resource_usage_deployment_memory_usage(\"$role$\", \"$group$\", $countMemFunc$, $drilldown_memory_usage_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval pct_mem_used = 'data.mem_used' / 'data.mem' * 100\n| eval server = host\n| `dmc_set_bin_for_timechart`\n| `dmc_timechart` partial=f limit=25 $countMemFunc$(pct_mem_used) AS pct_mem_used by server",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "20",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Memory Usage (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $countMemFuncLabel$ machine-wide physical memory usage over time.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "$countMemFuncLabel$ Physical Memory Usage",
        "query": "",
        "base": "",
        "text": "$countMemFuncLabel$ machine-wide physical memory usage over time by instance.",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Deployment-Wide $avgMemFuncLabel$ Physical Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage component=Hostwide\n| eval pct_mem_usage = 'data.mem_used' / 'data.mem' * 100 \n| eval server = host \n| `dmc_set_bin`\n| stats latest(pct_mem_usage) as dedup_pct_mem_usage by server _time \n| `dmc_timechart` $avgMemFunc$(dedup_pct_mem_usage) as pct_mem_usage",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Memory Usage (%)",
          "charting.axisLabelsY.majorUnit": "20",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 10,
        "kind": "viz",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "stats $countIOstatsFunc$(cpu_pct) as cpu_pct by host_mountpoint, _time\n                    | `dmc_iostats_rangemap(cpu_pct)`\n                    | `dmc_timechart_for_iostats` dc(host_mountpoint) as count by range\n                    | fields _time, \"80-100%\", \"60-80%\", \"0-60%\", \"abnormal\"",
        "base": "iostats_log_base",
        "text": "",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "stats $countIOstatsFunc$(cpu_pct) as cpu_pct by host_mountpoint, _time\n            | `dmc_iostats_rangemap(cpu_pct)`\n            | `dmc_timechart_for_iostats` dc(host_mountpoint) as count by range\n            | fields _time, \"80-100%\", \"60-80%\", \"0-60%\", \"abnormal\"",
        "base": "iostats_log_base",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}",
          "charting.axisTitleY.text": "Mount Point Count"
        }
      },
      {
        "row": 10,
        "kind": "table",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "stats $countIOstatsFunc$(cpu_pct) as cpu_pct by host_mountpoint\n            | `dmc_iostats_rangemap(cpu_pct)`\n            | where range==$drilldown_iostats_metric|s$\n            | eval host = replace(host_mountpoint, \":.*\", \"\")\n            | eval mount_point = replace(host_mountpoint, \".*:\", \"\")\n            | `dmc_drilldown_join_peers_by_peerURI`\n            | eval Action = Action.\" $role$\"\n            | fields serverName, machine, mount_point, cpu_pct, range, numberOfCores, ram, version, Action\n            | rename serverName as Instance, machine as Machine, mount_point as \"Mount Point\", cpu_pct as \"I/O Bandwidth Utilizatio (%)\", range as \"Storage I/O Saturation Range\", version as Version, numberOfCores as Cores, ram as RAM",
        "base": "iostats_log_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "`dmc_timechart_for_iostats` limit=25 $countIOstatsFunc$(cpu_pct) by host_mountpoint",
        "base": "iostats_log_base",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Storage I/O Saturation (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "$countIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "",
        "base": "",
        "text": "This panel shows data for instances running Splunk Enterprise 6.4+.\n        Storage I/O Saturation: Percentage of time the CPU was servicing requests. Disk saturation occurs when this value is close to 100%. \n        Learn more about the source of this data.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Deployment-wide $aggIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "`dmc_timechart_for_iostats` $aggIOstatsFunc$(cpu_pct) as cpu_pct",
        "base": "iostats_log_base",
        "text": "",
        "options": {
          "drilldown": "none",
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Storage I/O Saturation (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Deployment-wide $aggIOstatsFuncLabel$ Storage I/O Saturation",
        "query": "",
        "base": "",
        "text": "This panel shows data for instances running Splunk Enterprise 6.4+.\n        Storage I/O Saturation: Percentage of time the CPU was servicing requests. Disk saturation occurs when this value is close to 100%. \n        Learn more about the source of this data.",
        "options": {}
      },
      {
        "row": 12,
        "kind": "html",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 12,
        "kind": "viz",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_disk_objects component=Partitions\n                    | eval mount_point = 'data.mount_point'\n                    | eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n                    | eval pct_disk_usage = 1 - free / 'data.capacity'\n                    | `dmc_set_bin_for_timechart_for_disk_usage`\n                    | eval server_mount_point = host.\":\".mount_point\n                    | stats $countDiskFunc$(pct_disk_usage) as pct_disk_usage by server_mount_point _time\n                    | `dmc_disk_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_disk_objects component=Partitions\n            | eval mount_point = 'data.mount_point'\n            | eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n            | eval pct_disk_usage = 1 - free / 'data.capacity'\n            | `dmc_set_bin_for_timechart_for_disk_usage`\n            | eval server_mount_point = host.\":\".mount_point\n            | stats $countDiskFunc$(pct_disk_usage) as pct_disk_usage by server_mount_point _time\n            | `dmc_disk_usage_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}",
          "charting.axisTitleY.text": "Mount point count"
        }
      },
      {
        "row": 12,
        "kind": "table",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "`dmc_drilldown_resource_usage_deployment_disk_usage(\"$role$\", \"$group$\", $countDiskFunc$, $drilldown_disk_usage_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 12,
        "kind": "html",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_disk_objects component=Partitions\n            | eval mount_point = 'data.mount_point'\n            | eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n            | eval pct_disk_usage = (1 - free / 'data.capacity') * 100\n            | `dmc_set_bin_for_timechart_for_disk_usage`\n            | eval server_mount_point = host.\":\".mount_point\n            | `dmc_timechart` partial=f limit=25 $countDiskFunc$(pct_disk_usage) AS pct_disk_usage by server_mount_point",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}",
          "charting.axisTitleY.text": "Disk Usage (%)",
          "charting.axisY.minimumNumber": "0",
          "charting.axisY.maximumNumber": "100"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $countDiskFuncLabel$ disk usage over time. This metric takes into account all partitions in use by each instance.",
        "options": {}
      },
      {
        "row": 13,
        "kind": "html",
        "title": "$countDiskFuncLabel$ Disk Usage",
        "query": "",
        "base": "",
        "text": "$countDiskFuncLabel$ disk usage over time by instance. This metric takes into account all partitions in use by each instance.",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Deployment-Wide $avgDiskFuncLabel$ Disk Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_disk_objects component=Partitions\n            | eval server = host\n            | eval mount_point = 'data.mount_point'\n            | eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n            | eval pct_disk_usage = (1 - free / 'data.capacity') * 100\n            | `dmc_set_bin_for_disk_usage`\n            | stats latest(pct_disk_usage) as dedup_pct_disk_usage by server mount_point _time\n            | `dmc_timechart_for_disk_usage` $avgDiskFunc$(dedup_pct_disk_usage) as pct_disk_usage",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Disk Usage (%)",
          "charting.axisLabelsY.majorUnit": "20",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "Deployment-Wide $avgDiskFuncLabel$ Disk Usage",
        "query": "",
        "base": "",
        "text": "This metric takes into account all partitions in use by each Splunk Enterprise instance.",
        "options": {}
      }
    ],
    "sourceSha256": "f8a137211346314548e4210b1f22953d02c0de46ecab27cd84c3dadf684b97d0"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_instance",
    "label": "Resource Usage: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "role",
        "label": "Role",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Machine Information",
        "query": "| inputlookup dmc_assets\n| search serverName = $splunk_server$\n| stats first(serverName) as serverName, first(host) as host, first(machine) as machine\n| join type=outer serverName [\n  | rest splunk_server=$splunk_server$ /services/server/info\n  | fields serverName, numberOfCores, numberOfVirtualCores, physicalMemoryMB, os_name, cpu_arch\n]\n| `dmc_get_core_info`\n| fields machine core_info physicalMemoryMB os_name cpu_arch\n| rename machine as Machine, core_info AS \"CPU Cores (Physical / Virtual)\", physicalMemoryMB as \"Physical Memory Capacity (MB)\", os_name as \"Operating System\", cpu_arch as \"CPU Architecture\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.time.visible": "false",
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Machine Information",
        "query": "",
        "base": "",
        "text": "Click on machine name for more details.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Physical Memory Usage by Process Class",
        "query": "| rest splunk_server=$splunk_server$ /services/server/status/resource-usage/splunk-processes\n        | eval sid = 'search_props.sid'\n        | `dmc_classify_processes`\n        | eval x=\"memory_usage\"\n        | chart sum(mem_used) AS \"Memory Usage\" over x by process_class",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "Memory Usage (MB)",
          "charting.axisTitleX.text": "",
          "charting.axisLabelsX.majorLabelVisibility": "hide",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Physical Memory Usage by Process Class",
        "query": "",
        "base": "",
        "text": "Process class can be splunkd server, search, Splunk Web, index service, scripted input, KVStore, or other. Learn more",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "CPU Usage by Process Class",
        "query": "| rest splunk_server=$splunk_server$ /services/server/status/resource-usage/splunk-processes\n        | eval sid = 'search_props.sid'\n        | `dmc_classify_processes`\n        | eval x=\"cpu_usage\"\n        | chart sum(pct_cpu) AS \"CPU Usage\" over x by process_class",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisTitleX.text": "",
          "charting.axisLabelsX.majorLabelVisibility": "hide",
          "charting.axisY.minimumNumber": "0",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "CPU Usage by Process Class",
        "query": "",
        "base": "",
        "text": "CPU Usage - 100% is equal to 1 CPU core.\n        Process class can be splunkd server, search, Splunk Web, index service, scripted input, KVStore, or other. Learn more",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Disk Usage",
        "query": "| rest splunk_server=$splunk_server$ /services/server/status/partitions-space\n        | eval free = if(isnotnull(available), available, free)\n        | eval usage = round((capacity - free) / 1024, 2)\n        | eval capacity = round(capacity / 1024, 2)\n        | eval compare_usage = usage.\" / \".capacity\n        | eval pct_usage = round(usage / capacity * 100, 2)\n        | stats first(fs_type) as fs_type first(compare_usage) AS compare_usage first(pct_usage) as pct_usage by mount_point        \n        | rename mount_point as \"Mount Point\", fs_type as \"File System Type\", compare_usage as \"Disk Usage (GB)\", pct_usage as \"Disk Usage (%)\"",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$funcPerpMemLabel$ Physical Memory Usage by Process Class",
        "query": "`dmc_set_index_introspection` sourcetype=splunk_resource_usage component=PerProcess host=$host$\n        | `dmc_rename_introspection_fields`\n        | `dmc_classify_processes`\n        | `dmc_resource_usage_by_processes_timechart(mem_used, $funcPerpMem$)`",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "Memory Usage (MB)",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "$funcPerpMemLabel$ Physical Memory Usage by Process Class",
        "query": "",
        "base": "",
        "text": "Process class can be splunkd server, search, Splunk Web, index service, scripted input, KVStore, or other. Learn more",
        "options": {}
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "`dmc_set_index_introspection` sourcetype=splunk_resource_usage component=PerProcess host=$host$\n        | `dmc_rename_introspection_fields`\n        | `dmc_classify_processes`\n        | `dmc_resource_usage_by_processes_timechart(pct_cpu, $funcPerpCPU$)`",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "$funcPerpCPULabel$ CPU Usage by Process Class",
        "query": "",
        "base": "",
        "text": "CPU Usage - 100% is equal to 1 CPU core.\n        Process class can be splunkd server, search, Splunk Web, index service, scripted input, KVStore, or other. Learn more",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$funcDiskLabel$ Disk Usage",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_disk_objects component=Partitions data.mount_point=$mount_point|s$\n        | eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n        | eval usage = round(('data.capacity' - free) / 1024, 2)\n        | eval capacity = round('data.capacity' / 1024, 2)\n        | `dmc_timechart_for_disk_usage` latest(capacity) as Capacity $funcDisk$(usage) as Usage",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.lineDashStyle": "shortDash",
          "charting.chart.overlayFields": "Capacity",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.axisY.minimumNumber": "0",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "GB"
        }
      }
    ],
    "sourceSha256": "d9c0eb10a149a48e809e56637abc064af3a9d1adb27fbaeedcfc6dfee31ec71c"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_machine.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "resource_usage_machine",
    "label": "Resource Usage: Machine",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "machine",
        "label": "Machine:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Machine Information",
        "query": "| inputlookup dmc_assets\n| search serverName = $splunk_server$\n| stats first(serverName) as serverName, first(host) as host, first(machine) as machine\n| join type=outer serverName [\n  | rest splunk_server=$splunk_server$ /services/server/info\n  | fields serverName, numberOfCores, numberOfVirtualCores, physicalMemoryMB, os_name, cpu_arch\n]\n| `dmc_get_core_info`\n| fields machine core_info physicalMemoryMB os_name cpu_arch\n| rename machine as Machine, core_info AS \"CPU Cores (Physical / Virtual)\", physicalMemoryMB AS \"Physical Memory Capacity (MB)\", cpu_arch AS \"CPU Architecture\", os_name AS \"Operating System\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.time.visible": "false",
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "table",
        "title": "$countInstance$ Splunk Enterprise Instance(s) on this Machine",
        "query": "| inputlookup dmc_assets\n| search machine=$machine$\n| mvcombine search_group\n| join type=outer peerURI\n  [| rest splunk_server=local /services/search/distributed/peers\n   | rename title as peerURI]\n| join type=outer peerURI [|rest splunk_server=local /services/server/info\n  | eval peerURI = \"localhost\"\n  | eval status = \"Up\"\n  | fields peerURI, status, version]\n| join type=outer peerURI [|rest splunk_server=local /services/server/settings\n  | eval peerURI = \"localhost\"\n  | fields peerURI, mgmtHostPort]\n| join peerURI\n  [| `dmc_get_instance_roles` ]\n| eval status = if(status == \"Up\", status, \"Unreachable\")\n| makemv role\n| fields serverName, peerURI, role, version, status, mgmtHostPort\n| eval peerURI = if(peerURI == \"localhost\", \"localhost:\".mgmtHostPort, peerURI)\n| fields - mgmtHostPort\n| rename serverName as Instance, peerURI as URI, status as \"Status\", role as Role, version as \"Version\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.time.visible": "false",
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Click on instance name for more details.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Load Average",
        "query": "fields load_average",
        "base": "hostwide_metrics_api_base",
        "text": "",
        "options": {
          "height": "80px",
          "useColors": "true",
          "numberPrecision": "0.00",
          "rangeValues": "[20, 50]",
          "rangeColors": "[\"0x5cc05c\", \"0xed8440\", \"0xd6563c\"]"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "CPU Usage",
        "query": "fields splunk_server system user",
        "base": "hostwide_metrics_api_base",
        "text": "",
        "options": {
          "charting.axisTitleX.visibility": "collapsed",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.axisLabelsX.majorLabelVisibility": "hide",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Physical Memory Usage (MB)",
        "query": "fields mem mem_used\n| eval perc_80=mem*0.8 \n| eval perc_90=mem*0.9 \n| eval mem_used=round(mem_used, 0) \n| gauge mem_used 0 perc_80 perc_90, mem",
        "base": "hostwide_metrics_api_base",
        "text": "",
        "options": {
          "charting.chart": "fillerGauge",
          "charting.legend.placement": "none",
          "charting.axisTitleY.text": "Memory (MB)"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Disk Usage",
        "query": "| rest splunk_server=$instanceDiskUsageSnapshot$ /services/server/status/partitions-space\n| join type=outer splunk_server, mount_point [\n  | rest splunk_server=$instanceDiskUsageSnapshot$ /services/server/status/resource-usage/iostats\n  | eval iops = round(reads_ps + writes_ps)\n  | fields splunk_server, mount_point, iops, cpu_pct]\n| eval free = if(isnotnull(available), available, free)\n| eval usage = round((capacity - free) / 1024, 2)\n| eval capacity = round(capacity / 1024, 2)\n| eval compare_usage = usage.\" / \".capacity\n| eval pct_usage = round(usage / capacity * 100, 2) \n| stats first(fs_type) as fs_type first(compare_usage) as compare_usage first(pct_usage) as pct_usage, first(iops) as iops, first(cpu_pct) as cpu_pct by mount_point\n| rename mount_point as \"Mount Point\", fs_type as \"File System Type\", compare_usage as \"Disk Usage (GB)\", capacity as \"Capacity (GB)\", pct_usage as \"Disk Usage (%)\", iops as \"I/O operations per second\", cpu_pct as \"Storage I/O Saturation(%)\"",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$funcLoadAvgLabel$ Load Average",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=Hostwide\n| `dmc_timechart` $funcLoadAvg$(data.normalized_load_avg_1min) AS \"load average\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "Load Average",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$funcCPULabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=Hostwide\n| `dmc_timechart` $funcCPU$(data.cpu_system_pct) AS \"system\" $funcCPU$(data.cpu_user_pct) AS \"user\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.maximumNumber": "100",
          "charting.axisY.minimumNumber": "0",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$funcMemLabel$ Physical Memory Usage",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=Hostwide\n| `dmc_timechart` latest(data.mem) AS \"capacity\" $funcMem$(data.mem_used) AS \"usage\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.lineDashStyle": "shortDash",
          "charting.chart.overlayFields": "capacity",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.axisTitleY.text": "Memory Usage (MB)"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "$funcDiskLabel$ Disk Space",
        "query": "`dmc_set_index_introspection` host=$hostDiskUsageHistorical$ sourcetype=splunk_disk_objects component=Partitions data.mount_point=$mount_point|s$\n| eval free = if(isnotnull('data.available'), 'data.available', 'data.free')\n| eval usage = round(('data.capacity' - free) / 1024, 2)\n| eval capacity = round('data.capacity' / 1024, 2)\n| `dmc_timechart_for_disk_usage` latest(capacity) as capacity $funcDisk$(usage) as usage",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "area",
          "charting.lineDashStyle": "shortDash",
          "charting.chart.overlayFields": "capacity",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.axisY.minimumNumber": "0",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "GB"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Average I/O Usage and Performance",
        "query": "| search data.mount_point=$io_mount_point|s$\n            | `dmc_timechart_for_iostats` per_second(op_count) as iops, avg(data.cpu_pct) as avg_cpu_pct, avg(data.avg_service_ms) as avg_service_ms, avg(data.avg_total_ms) as avg_wait_ms, avg(data.network_pct) as avg_network_pct\n            | eval iops = round(iops)\n            | eval avg_cpu_pct = round(avg_cpu_pct)\n            | eval avg_service_ms = round(avg_service_ms)\n            | eval avg_wait_ms = round(avg_wait_ms)\n            | eval avg_network_pct = round(avg_network_pct)\n            | fields _time, iops $io_overlay$\n            | rename $io_overlay$ as $io_overlay_label|s$",
        "base": "io_log_base_search",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.chart.overlayFields": "$io_overlay_label|s$",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "$io_overlay_axis_label$",
          "charting.axisY2.enabled": "true",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Average I/O Usage and Performance",
        "query": "",
        "base": "",
        "text": "This panel shows data for instances running Splunk Enterprise 6.4+.\n        Service Time: The time for the device to execute the requests.\n        Wait Time: I/O queue + execution time for requests to complete. This reflects the end-to-end time spent on the requests.\n        Storage I/O Saturation: Percentage of time the CPU was servicing requests. Disk saturation occurs when this value is close to 100%. \n        Storage I/O Saturation (NFS): Percentage of time network resources were used to serve requests. Only applies to NFS disks. \n        Learn more about the source of this data.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Average I/O Usage by Mount Point",
        "query": "`dmc_timechart_for_iostats` per_second(op_count) as op_count by mount_point",
        "base": "io_log_base_search",
        "text": "",
        "options": {
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Average I/O Usage by Mount Point",
        "query": "",
        "base": "",
        "text": "This panel shows data for instances running Splunk Enterprise 6.4+.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Average I/O Performance by Mount Point",
        "query": "`dmc_timechart_for_iostats` avg($io_perf_metric$) by mount_point",
        "base": "io_log_base_search",
        "text": "",
        "options": {
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$io_perf_metric_label$",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Average I/O Performance by Mount Point",
        "query": "",
        "base": "",
        "text": "This panel shows data for instances running Splunk Enterprise 6.4+.",
        "options": {}
      }
    ],
    "sourceSha256": "f4f40bfce90225f4757604d6d38c56aabbd7640ca9c6f6607f76dda7c4e18d23"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_activity_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_activity_deployment",
    "label": "Scheduler Activity: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Search Heads"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Scheduler Status by Instance ($total_instance_count$)",
        "query": "| rest splunk_server_group=dmc_group_search_head splunk_server_group=\"$group$\" /servicesNS/-/-/saved/searches preserve_args_case=t noProxy=t search=\"is_scheduled=1\" search=\"disabled=0\"\n            | stats count by splunk_server\n            | join splunk_server type=outer [\n              | rest splunk_server_group=dmc_group_search_head splunk_server_group=\"$group$\" /services/server/status/limits/search-concurrency\n              | fields splunk_server max_hist_scheduled_searches, max_rt_scheduled_searches]\n            | join splunk_server type=outer [\n              | rest splunk_server_group=dmc_group_search_head splunk_server_group=\"$group$\" /services/server/status/resource-usage/splunk-processes\n              | search search_props.role=\"head\" `dmc_match_all_scheduled_search_types`\n              | dedup search_props.sid\n              | stats count(eval('search_props.mode'==\"historical batch\" OR 'search_props.mode'==\"historical\")) as count_hist_search, count(eval('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\")) as count_rt_search by splunk_server ]\n            | join splunk_server type=outer [\n              | rest splunk_server_group=dmc_group_search_head splunk_server_group=\"$group$\" /services/server/info\n              | fields splunk_server, numberOfCores, numberOfVirtualCores]\n            | eval count_hist_search = if(isnull(count_hist_search), 0, count_hist_search)\n            | eval count_rt_search = if(isnull(count_rt_search), 0, count_rt_search)\n            | eval hist_concur_vs_limit = count_hist_search.\" / \".max_hist_scheduled_searches\n            | eval rt_concur_vs_limit = count_rt_search.\" / \".max_rt_scheduled_searches\n            | `dmc_get_core_info`\n            | fields splunk_server, core_info, hist_concur_vs_limit, rt_concur_vs_limit, count\n            | rename splunk_server as Instance, core_info AS \"CPU Cores (Physical / Virtual)\", hist_concur_vs_limit as \"Concurrency of Historical Scheduled Report (Running/Limit)\", rt_concur_vs_limit as \"Concurrency of Real-time Scheduled Report (Running/Limit)\", count as \"Unique Scheduled Reports\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Scheduler Status by Instance ($total_instance_count$)",
        "query": "",
        "base": "",
        "text": "If your concurrency limits are being reached, you can configure the priority of scheduled reports. Learn More.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Scheduler Execution Count by $scheduler_execution_split_by_label$",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR status=\"deferred\")\n            | timechart partial=f limit=20 count by $scheduler_execution_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom",
          "charting.fieldColors": "{\"completed\": 0xa2cc3e, \"deferred\": 0xf2b827, \"skipped\":0xd6563c}"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Scheduler Execution Count Across All Instances",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR status=\"deferred\")\n            | bin _time minspan=1min\n            | stats count by host, _time\n            | timechart partial=f $scheduler_execution_metric$\n            | rename total as Total, min_count as Minimum, avg_count as Average, median_count as Median, max_count as Maximum",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Concurrency of Scheduled Reports by Instance",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=splunk_resource_usage component=PerProcess data.search_props.role=\"head\" data.search_props.sid::* `dmc_match_all_scheduled_search_types`\n            | `dmc_set_bin`\n            | `dmc_rename_introspection_fields`\n            | stats dc(sid) AS distinct_search_count by _time, host\n            | `dmc_timechart` partial=f limit=20 $agg_report_concurrency_by_instance$(distinct_search_count) AS agg_distinct_search_count by host\n            | eval agg_distinct_search_count = round(agg_distinct_search_count, 0)\n            | rename agg_distinct_search_count as \"Concurrent Report Count\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Concurrency of Scheduled Reports Across All Instances",
        "query": "`dmc_set_index_introspection` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=splunk_resource_usage component=PerProcess data.search_props.role=\"head\" data.search_props.sid::* `dmc_match_all_scheduled_search_types`\n            | `dmc_set_bin`\n            | `dmc_rename_introspection_fields`\n            | stats dc(sid) AS distinct_search_count by _time, host\n            | stats sum(distinct_search_count) as count by _time\n            | `dmc_timechart` partial=f $agg_report_concurrency_all_instance$\n            | rename min_count as Minimum, avg_count as Average, median_count as Median, max_count as Maximum",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Skip Ratio by Instance",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR status=\"deferred\")\n            | stats count(eval(status==\"completed\" OR status==\"skipped\")) AS total_exec, count(eval(status==\"skipped\")) AS skipped_exec by _time, host, app, savedsearch_name, user, savedsearch_id\n            | `dmc_timechart` partial=f limit=20 eval(round(sum(skipped_exec) / sum(total_exec) * 100, 2)) as skip_ratio by host\n            | rename skip_ratio as \"Skip Ratio\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Skip Ratio (%)",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Skip Ratio Across All Instances",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR status=\"deferred\")\n            | stats count(eval(status==\"completed\" OR status==\"skipped\")) AS total_exec, count(eval(status==\"skipped\")) AS skipped_exec by _time, savedsearch_id\n            | `dmc_timechart` partial=f eval(round(sum(skipped_exec) / sum(total_exec) * 100, 2)) as skip_ratio\n            | rename skip_ratio as \"Skip Ratio\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Skip Ratio (%)",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Average Execution Latency by $exec_lat_split_by_label$",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler status=\"completed\"\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | timechart partial=f limit=20 eval(round(avg(execution_latency), 0)) as latency by $exec_lat_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Latency (seconds)",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Execution Latency Across All Instances",
        "query": "`dmc_set_index_internal` search_group=dmc_group_search_head search_group=\"$group$\" sourcetype=scheduler status=\"completed\"\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | timechart partial=f $exec_lat_agg$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "zero",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Latency (seconds)",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Statistics include only instances on which one or more searches are running at any given time.",
        "options": {}
      }
    ],
    "sourceSha256": "8bcbb90d4efeb46b27473389786e10e07ee2c1194ea70a3a8dc1b7320eaf694b"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_activity_instance.env_cloud",
    "label": "Scheduler Activity",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Status\n            Activity\n            Performance",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Concurrency of Scheduled Reports (Running/Limit)",
        "query": "eval scheduled_vs_total_hist_search_limit = \"$count_hist_scheduled_search$\".\"/\".max_hist_scheduled_searches\n            | fields scheduled_vs_total_hist_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Concurrency of Scheduled Reports (Running/Limit)",
        "query": "eval scheduled_vs_total_rt_search_limit = \"$count_rt_scheduled_search$\".\"/\".max_rt_scheduled_searches\n            | fields scheduled_vs_total_rt_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Running Historical Scheduled Reports",
        "query": "where 'search_props.mode'==\"historical batch\" OR 'search_props.mode'==\"historical\"\n            | fields search_props.name, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed, search_props.sid\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.name as \"Scheduled Report Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Spent (sec)\", search_props.sid as \"SID\"",
        "base": "snapshot_search_concurreny_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Running Historical Scheduled Reports",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Running Real-time Scheduled Reports",
        "query": "where 'search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\"\n            | fields search_props.name, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed, search_props.sid\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.name as \"Scheduled Report Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Spent (sec)\", search_props.sid as \"SID\"",
        "base": "snapshot_search_concurreny_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Running Real-time Scheduled Reports",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Unique Scheduled Reports",
        "query": "stats count",
        "base": "inventory_base",
        "text": "",
        "options": {
          "underLabel": "Click to show full inventory",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Count of Reports Scheduled",
        "query": "| rest splunk_server=local \"/servicesNS/-/-/saved/searches/\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | table scheduled_times\n            | eval scheduled_times_count = mvcount(scheduled_times)\n            | stats sum(scheduled_times_count) as count\n            | eval count = `dmc_convert_count_unit(count)`",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "in next 7 days",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Skip Ratio (Last Hour)",
        "query": "fields _time, skip_ratio",
        "base": "skip_ratio_and_exec_latency_base",
        "text": "",
        "options": {
          "afterLabel": "%",
          "colorBy": "trend",
          "numberPrecision": "0.00",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trendColorInterpretation": "inverse",
          "trendDisplayMode": "absolute",
          "trendInterval": "-1h",
          "useColors": "1",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Average Execution Latency (Last Hour)",
        "query": "fields _time, avg_exec_latency",
        "base": "skip_ratio_and_exec_latency_base",
        "text": "",
        "options": {
          "afterLabel": "sec",
          "numberPrecision": "0.00",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trendDisplayMode": "absolute",
          "trendInterval": "-1h",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Skip Ratio and Execution Latency: The single values show data in the past full hour. Trends compare to 1 hour before that. Sparklines show data over past 24 hours.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Inventory of Scheduled Reports ($scheduled_search_count$)",
        "query": "$inventory_app_filter$\n            | $inventory_user_filter$\n            | eval dispatch.earliest_time = if(isnull('dispatch.earliest_time') OR 'dispatch.earliest_time' == \"0\" OR\n            'dispatch.earliest_time'==\"\", \"not set\", 'dispatch.earliest_time')\n            | eval dispatch.latest_time = if(isnull('dispatch.latest_time') OR 'dispatch.latest_time' == \"\", \"not set\",\n            'dispatch.latest_time')\n            | eval actions = if(isnull(actions) OR actions == \"\", \"none\", actions)\n            | rename title as \"Report Name\", eai:acl.app as App, eai:acl.owner as User, cron_schedule as \"Cron\n            Schedule\", dispatch.earliest_time as \"Earliest Time\", dispatch.latest_time as \"Latest Time\", schedule_window as \"Schedule Window (minutes)\", actions as Actions",
        "base": "inventory_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Inventory of Scheduled Reports ($scheduled_search_count$)",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Count of Scheduler Executions",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename status as Status, app as App, user as User, savedsearch_name as \"Report Name\", alert_actions as \"Alert Actions\", count as Count, percent as \"Percent of Total\"",
        "base": "scheduler_execution_count_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Count of Scheduler Executions Over Time",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\")\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | timechart partial=f count by $scheduler_execution_timechart_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom",
          "charting.fieldColors": "{\"completed\": 0xa2cc3e, \"deferred\": 0xf2b827, \"skipped\":0xd6563c}"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Scheduled Report Completions",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=splunkd group=\"searchscheduler\"\n            | `dmc_timechart_for_metrics_log` sum(completed) as completed_count,\n            $scheduler_completion_runtime_aggregation$(total_runtime) as total_runtime\n            | eval total_runtime=round(total_runtime, 0)",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.chart.overlayFields": "total_runtime",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "Total Runtime (seconds)",
          "charting.axisY2.enabled": "true",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$concurrencyFuncLabel$ Concurrency of Scheduled Reports",
        "query": "`dmc_set_index_introspection` splunk_server=local sourcetype=splunk_resource_usage component=PerProcess\n            data.search_props.role=\"head\" data.search_props.mode=\"$searchMode$\" (data.search_props.type=\"datamodel\n            acceleration\" OR data.search_props.type=\"report acceleration\" OR data.search_props.type=\"scheduled\" OR\n            data.search_props.type=\"summary indexing\") data.search_props.sid::*\n            | `dmc_rename_introspection_fields`\n            | `dmc_set_bin`\n            | stats dc(sid) AS distinct_search_count by _time, $concurrencySplitBy$\n            | `dmc_timechart` $concurrencyFunction$(distinct_search_count) AS \"$concurrencyFunction$ of search\n            concurrency\" by $concurrencySplitBy$\n            | eval search_mode = \"$searchMode$\"\n            | eval scheduled_search_limit = case(match(search_mode, \"historical\"), $max_hist_scheduled_searches$,\n            match(search_mode, \"RT\"), $max_rt_scheduled_searches$, true(), NULL)\n            | fields - search_mode",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.chart.overlayFields": "scheduled_search_limit",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 10,
        "kind": "table",
        "title": "Runtime Statistics",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\")\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | stats avg(run_time) as runtime, avg(execution_latency) AS avg_exec_latency, count(eval(status==\"completed\" OR status==\"skipped\")) AS total_exec, count(eval(status==\"skipped\")) AS skipped_exec count(eval(status==\"deferred\")) AS deferred_exec by app, savedsearch_name, user, savedsearch_id\n            | join savedsearch_id type=outer [\n            | rest splunk_server=local \"/servicesNS/-/-/saved/searches/\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | search NOT (dispatch.earliest_time=rt* OR dispatch.latest_time=rt*)\n            | stats dc(scheduled_times) as count max(scheduled_times) as max_t min(scheduled_times) as min_t by title, eai:acl.app, eai:acl.owner cron_schedule\n            | eval schedule_interval=round((max_t-min_t)/(count-1), 0)\n            | eval savedsearch_id = 'eai:acl.owner'.\";\".'eai:acl.app'.\";\".title\n            | fields savedsearch_id, cron_schedule, schedule_interval ]\n            | eval runtime = round(runtime, 0)\n            | eval avg_exec_latency = round(avg_exec_latency, 0)\n            | eval search_workload = round(runtime / schedule_interval * 100, 2).\" %\"\n            | eval skip_ratio = round(skipped_exec / total_exec * 100, 2).\" %\"\n            | fields savedsearch_name, app, user, cron_schedule, schedule_interval, runtime, search_workload, total_exec, skipped_exec, skip_ratio, deferred_exec, avg_exec_latency\n            | sort - search_workload\n            | rename savedsearch_name as \"Report Name\", app as App, user as User, cron_schedule as \"Cron Schedule\", runtime as \"Average Runtime (sec)\", total_exec as \"Total Executions\", skip_ratio as \"Skip Ratio\", skipped_exec as \"Skipped Executions\", deferred_exec AS \"Deferred Executions\", schedule_interval as \"Schedule Interval (sec)\", search_workload as \"Interval Load Factor\", avg_exec_latency AS \"Average Execution Latency (sec)\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Runtime Statistics",
        "query": "",
        "base": "",
        "text": "Interval Load Factor = Average Runtime / Schedule Interval * 100",
        "options": {}
      },
      {
        "row": 10,
        "kind": "event",
        "title": "Runtime Statistics Drilldown: $runtime_statistics_drilldown$",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\") savedsearch_name=$runtime_statistics_drilldown|s$",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Runtime Statistics Drilldown: $runtime_statistics_drilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 11,
        "kind": "chart",
        "title": "Execution Latency Over Time",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler status=\"completed\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | timechart eval(round($exe_lag_agg$(execution_latency), 0)) as latency by $exe_lag_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Latency (seconds)",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Execution Latency Over Time",
        "query": "",
        "base": "",
        "text": "Execution Latency = Dispatch Time - (Scheduled Time + Schedule Window Time)\n        The execution latency expresses the delay in seconds between the planned dispatch time of a search and its actual dispatch time. It takes into account a schedule window if one is configured for this search. Learn More",
        "options": {}
      },
      {
        "row": 12,
        "kind": "table",
        "title": "Count of Skipped Scheduled Reports",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename reason as Reason, savedsearch_name as \"Report Name\", alert_actions as \"Alert Actions\", app as App, user as User, count as Count, percent as \"Percent of Total\"",
        "base": "count_skipped_search_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Count of Skipped Reports Over Time",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler status=\"skipped\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval reason = if(isnull(reason) OR reason == \"\", \"none\", reason)\n            | timechart count by $count_skipped_timechart_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 13,
        "kind": "table",
        "title": "Count of Skipped Reports by Name and Reason",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler status=\"skipped\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval reason = if(isnull(reason) OR reason == \"\", \"none\", reason)\n            | stats count AS count values(alert_actions) AS alert_actions by savedsearch_name, reason\n            | eval reason_and_count = reason.\" (\".count.\")\"\n            | stats values(reason_and_count) AS reasons first(alert_actions) AS alert_actions by savedsearch_name\n            | rename reasons AS \"Skip Reason (Skip Count)\" alert_actions AS \"Alert Actions\" savedsearch_name AS \"Report\n            Name\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 13,
        "kind": "table",
        "title": "Scheduler Errors and Warnings",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename event_message as Message, count as Count, percent as \"Percent of Total\"",
        "base": "count_error_warning_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "row"
        }
      },
      {
        "row": 14,
        "kind": "event",
        "title": "Scheduler Errors and Warnings Event Details",
        "query": "`dmc_set_index_internal` splunk_server=local sourcetype=scheduler (log_level=\"ERROR\" OR log_level=\"WARN*\") punct=$warningErrorPunct|s$",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 14,
        "kind": "html",
        "title": "Scheduler Errors and Warnings Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      }
    ],
    "sourceSha256": "e9a2e0c2ee153a836b4ee6259090e8510a949480a598c3a228b7d05801bd83dd"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_activity_instance.prod_lite",
    "label": "System activity",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "time",
        "label": "time",
        "default": "-24h@h",
        "choices": [
          {
            "value": "-60m@m",
            "label": "Last 60 minutes"
          },
          {
            "value": "-4h@h",
            "label": "Last 4 hours"
          },
          {
            "value": "-12h@h",
            "label": "Last 12 hours"
          },
          {
            "value": "-24h@h",
            "label": "Last 24 hours"
          },
          {
            "value": "-7d@d",
            "label": "Last 7 days"
          },
          {
            "value": "-30d@d",
            "label": "Last 30 days"
          },
          {
            "value": "@y",
            "label": "Year to date"
          },
          {
            "value": "",
            "label": "All time"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "chart",
        "title": "",
        "query": "`dmc_audit_get_searches(\"*\")` | search search_id != \"rt_*\" | search user != null() | timechart count $bypropertysearchcount$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": ""
        }
      },
      {
        "row": 1,
        "kind": "chart",
        "title": "",
        "query": "`dmc_audit_get_searches(\"*\")` | search search_id != \"rt_*\" | search user != null() | stats min(_time) as _time first(user) as user max(total_run_time) as total_run_time by $grouping$ | timechart sum(total_run_time) $bypropertyruntime$ | sort - sum(total_run_time) | head 5",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": ""
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Scheduled Reports",
        "query": "`dmc_set_index_internal` host=* sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR status=\"deferred\")\n| eval window_time = if(isnotnull(window_time), window_time, 0)\n| eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n| stats avg(run_time) as runtime, avg(execution_latency) AS avg_exec_latency, count(eval(status==\"completed\" OR status==\"skipped\")) AS total_exec, count(eval(status==\"skipped\")) AS skipped_exec count(eval(status==\"deferred\")) AS deferred_exec by app, savedsearch_name, user, savedsearch_id\n| join savedsearch_id type=outer [\n| rest splunk_server=local \"/servicesNS/-/-/saved/searches/\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n| search NOT (dispatch.earliest_time=rt* OR dispatch.latest_time=rt*)\n| stats dc(scheduled_times) as count max(scheduled_times) as max_t min(scheduled_times) as min_t by title, eai:acl.app, eai:acl.owner cron_schedule\n| eval schedule_interval=round((max_t-min_t)/(count-1), 0)\n| eval savedsearch_id = 'eai:acl.owner'.\";\".'eai:acl.app'.\";\".title\n| fields savedsearch_id, cron_schedule, schedule_interval ]\n| eval runtime = round(runtime, 0)\n| eval avg_exec_latency = round(avg_exec_latency, 0)\n| eval search_workload = round(runtime / schedule_interval * 100, 2).\" %\"\n| eval skip_ratio = round(skipped_exec / total_exec * 100, 2).\" %\"\n| fields savedsearch_name, user, cron_schedule, schedule_interval, runtime, search_workload, total_exec, skipped_exec, skip_ratio, deferred_exec, avg_exec_latency\n| sort - search_workload\n| rename savedsearch_name as \"Report Name\", app as App, user as User, cron_schedule as \"Cron Schedule\", runtime as \"Average Runtime (sec)\", total_exec as \"Total Executions\", skip_ratio as \"Skip Ratio\", skipped_exec as \"Skipped Executions\", deferred_exec AS \"Deferred Executions\", schedule_interval as \"Schedule Interval (sec)\", search_workload as \"Interval Load Factor\", avg_exec_latency AS \"Average Execution Latency (sec)\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Scheduled Reports",
        "query": "",
        "base": "",
        "text": "Interval Load Factor = Average Runtime / Schedule Interval * 100",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Count of Scheduler Executions Over Time",
        "query": "`dmc_set_index_internal` host=* sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\nstatus=\"deferred\")\n| eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n| timechart partial=f count by $scheduler_execution_timechart_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom",
          "charting.fieldColors": "{\"success\": 0xa2cc3e, \"deferred\": 0xf2b827, \"skipped\":0xd6563c}"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Count of Skipped Reports by Name and Reason",
        "query": "`dmc_set_index_internal` host=* sourcetype=scheduler status=\"skipped\"\n| eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n| eval reason = if(isnull(reason) OR reason == \"\", \"none\", reason)\n| stats count AS count values(alert_actions) AS alert_actions by savedsearch_name, reason\n| eval reason_and_count = reason.\" (\".count.\")\"\n| stats values(reason_and_count) AS reasons first(alert_actions) AS alert_actions by savedsearch_name\n| rename reasons AS \"Skip Reason (Skip Count)\" alert_actions AS \"Alert Actions\" savedsearch_name AS \"Report\nName\"",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "4aa0a2cb49cec661fd26e6102a1bf9922467acc8062d7b6565ec167d4d7b8c5b"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_activity_instance",
    "label": "Scheduler Activity: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "All Search Heads"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Status\n            Activity\n            Performance",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Hardware Information",
        "query": "| rest splunk_server=$splunk_server$ /services/server/info\n            | eval core_info = if(isnull(numberOfCores), \"N/A\", numberOfCores).\"/\".if(isnull(numberOfVirtualCores), \"N/A\", numberOfVirtualCores)\n            | fields core_info",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "CPU Cores (Physical / Virtual)",
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Concurrency of Scheduled Reports (Running/Limit)",
        "query": "eval scheduled_vs_total_hist_search_limit = \"$count_hist_scheduled_search$\".\"/\".max_hist_scheduled_searches\n            | fields scheduled_vs_total_hist_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Concurrency of Scheduled Reports (Running/Limit)",
        "query": "eval scheduled_vs_total_rt_search_limit = \"$count_rt_scheduled_search$\".\"/\".max_rt_scheduled_searches\n            | fields scheduled_vs_total_rt_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Running Historical Scheduled Reports",
        "query": "where 'search_props.mode'==\"historical batch\" OR 'search_props.mode'==\"historical\"\n            | fields search_props.name, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed, search_props.sid\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.name as \"Scheduled Report Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Spent (sec)\", search_props.sid as \"SID\"",
        "base": "snapshot_search_concurreny_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Running Historical Scheduled Reports",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Running Real-time Scheduled Reports",
        "query": "where 'search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\"\n            | fields search_props.name, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed, search_props.sid\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.name as \"Scheduled Report Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Spent (sec)\", search_props.sid as \"SID\"",
        "base": "snapshot_search_concurreny_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Running Real-time Scheduled Reports",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Unique Scheduled Reports",
        "query": "stats count",
        "base": "inventory_base",
        "text": "",
        "options": {
          "underLabel": "Click to show full inventory",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Count of Reports Scheduled",
        "query": "| rest splunk_server=$splunk_server$ \"/servicesNS/-/-/saved/searches/\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | table scheduled_times\n            | eval scheduled_times_count = mvcount(scheduled_times)\n            | stats sum(scheduled_times_count) as count\n            | eval count = `dmc_convert_count_unit(count)`",
        "base": "",
        "text": "",
        "options": {
          "underLabel": "in next 7 days",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Skip Ratio (Last Hour)",
        "query": "fields _time, skip_ratio",
        "base": "skip_ratio_and_exec_latency_base",
        "text": "",
        "options": {
          "afterLabel": "%",
          "colorBy": "trend",
          "numberPrecision": "0.00",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trendColorInterpretation": "inverse",
          "trendDisplayMode": "absolute",
          "trendInterval": "-1h",
          "useColors": "1",
          "height": "80px"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Average Execution Latency (Last Hour)",
        "query": "fields _time, avg_exec_latency",
        "base": "skip_ratio_and_exec_latency_base",
        "text": "",
        "options": {
          "afterLabel": "sec",
          "numberPrecision": "0.00",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trendDisplayMode": "absolute",
          "trendInterval": "-1h",
          "height": "80px"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Skip Ratio and Execution Latency: The single values show data in the past full hour. Trends compare to 1 hour before that. Sparklines show data over past 24 hours.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Inventory of Scheduled Reports ($scheduled_search_count$)",
        "query": "$inventory_app_filter$\n            | $inventory_user_filter$\n            | eval dispatch.earliest_time = if(isnull('dispatch.earliest_time') OR 'dispatch.earliest_time' == \"0\" OR\n            'dispatch.earliest_time'==\"\", \"not set\", 'dispatch.earliest_time')\n            | eval dispatch.latest_time = if(isnull('dispatch.latest_time') OR 'dispatch.latest_time' == \"\", \"not set\",\n            'dispatch.latest_time')\n            | eval actions = if(isnull(actions) OR actions == \"\", \"none\", actions)\n            | rename title as \"Report Name\", eai:acl.app as App, eai:acl.owner as User, cron_schedule as \"Cron\n            Schedule\", dispatch.earliest_time as \"Earliest Time\", dispatch.latest_time as \"Latest Time\", schedule_window as \"Schedule Window (minutes)\", actions as Actions",
        "base": "inventory_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Inventory of Scheduled Reports ($scheduled_search_count$)",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Count of Scheduler Executions",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename status as Status, app as App, user as User, savedsearch_name as \"Report Name\", alert_actions as \"Alert Actions\", count as Count, percent as \"Percent of Total\"",
        "base": "scheduler_execution_count_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "Count of Scheduler Executions Over Time",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\")\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | timechart partial=f count by $scheduler_execution_timechart_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom",
          "charting.fieldColors": "{\"completed\": 0xa2cc3e, \"deferred\": 0xf2b827, \"skipped\":0xd6563c}"
        }
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Scheduled Report Completions",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=\"searchscheduler\" host=$host$\n            | `dmc_timechart_for_metrics_log` sum(completed) as completed_count,\n            $scheduler_completion_runtime_aggregation$(total_runtime) as total_runtime\n            | eval total_runtime=round(total_runtime, 0)",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.chart.overlayFields": "total_runtime",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "Total Runtime (seconds)",
          "charting.axisY2.enabled": "true",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "$concurrencyFuncLabel$ Concurrency of Scheduled Reports",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.role=\"head\" data.search_props.mode=\"$searchMode$\" data.search_props.sid::* `dmc_match_all_scheduled_search_types`\n            | `dmc_rename_introspection_fields`\n            | `dmc_set_bin`\n            | stats dc(sid) AS distinct_search_count by _time, $concurrencySplitBy$\n            | `dmc_timechart` $concurrencyFunction$(distinct_search_count) AS \"$concurrencyFunction$ of search\n            concurrency\" by $concurrencySplitBy$\n            | eval search_mode = \"$searchMode$\"\n            | eval scheduled_search_limit = case(match(search_mode, \"historical\"), $max_hist_scheduled_searches$,\n            match(search_mode, \"RT\"), $max_rt_scheduled_searches$, true(), NULL)\n            | fields - search_mode",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.chart.overlayFields": "scheduled_search_limit",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Aggregate Scheduled Search Runtime",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::* data.search_props.role=\"head\" `dmc_match_all_scheduled_search_types`\n            | `dmc_set_bin`\n            | `dmc_rename_introspection_fields`\n            | stats max(elapsed) as ELAPSED by sid $runtimeSplitBy$ _time\n            | streamstats current=t global=f window=2 earliest(ELAPSED) as prev_ELAPSED latest(ELAPSED) as curr_ELAPSED by sid $runtimeSplitBy$\n            | eval `dmc_collection_interval`\n            | eval delta_ELAPSED = curr_ELAPSED - prev_ELAPSED\n            | eval runtime = if(delta_ELAPSED = 0, min(curr_ELAPSED, collection_interval), delta_ELAPSED)\n            | `dmc_timechart` sum(runtime) by $runtimeSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleY.text": "Runtime (seconds)",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Aggregate Scheduled Search Runtime",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Runtime Statistics",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\")\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | stats avg(run_time) as runtime, avg(execution_latency) AS avg_exec_latency, count(eval(status==\"completed\" OR status==\"skipped\")) AS total_exec, count(eval(status==\"skipped\")) AS skipped_exec count(eval(status==\"deferred\")) AS deferred_exec by app, savedsearch_name, user, savedsearch_id\n            | join savedsearch_id type=outer [\n            | rest splunk_server=$splunk_server$ \"/servicesNS/-/-/saved/searches/\" earliest_time=`time_modifier(-0s@s)` latest_time=`time_modifier(+8d@d)` search=\"is_scheduled=1\" search=\"disabled=0\"\n            | search NOT (dispatch.earliest_time=rt* OR dispatch.latest_time=rt*)\n            | stats dc(scheduled_times) as count max(scheduled_times) as max_t min(scheduled_times) as min_t by title, eai:acl.app, eai:acl.owner cron_schedule\n            | eval schedule_interval=round((max_t-min_t)/(count-1), 0)\n            | eval savedsearch_id = 'eai:acl.owner'.\";\".'eai:acl.app'.\";\".title\n            | fields savedsearch_id, cron_schedule, schedule_interval ]\n            | eval runtime = round(runtime, 0)\n            | eval avg_exec_latency = round(avg_exec_latency, 0)\n            | eval search_workload = round(runtime / schedule_interval * 100, 2).\" %\"\n            | eval skip_ratio = round(skipped_exec / total_exec * 100, 2).\" %\"\n            | fields savedsearch_name, app, user, cron_schedule, schedule_interval, runtime, search_workload, total_exec, skipped_exec, skip_ratio, deferred_exec, avg_exec_latency\n            | sort - search_workload\n            | rename savedsearch_name as \"Report Name\", app as App, user as User, cron_schedule as \"Cron Schedule\", runtime as \"Average Runtime (sec)\", total_exec as \"Total Executions\", skip_ratio as \"Skip Ratio\", skipped_exec as \"Skipped Executions\", deferred_exec AS \"Deferred Executions\", schedule_interval as \"Schedule Interval (sec)\", search_workload as \"Interval Load Factor\", avg_exec_latency AS \"Average Execution Latency (sec)\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Runtime Statistics",
        "query": "",
        "base": "",
        "text": "Interval Load Factor = Average Runtime / Schedule Interval * 100",
        "options": {}
      },
      {
        "row": 11,
        "kind": "event",
        "title": "Runtime Statistics Drilldown: $runtime_statistics_drilldown$",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler (status=\"completed\" OR status=\"skipped\" OR\n            status=\"deferred\") savedsearch_name=$runtime_statistics_drilldown|s$",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Runtime Statistics Drilldown: $runtime_statistics_drilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "Execution Latency Over Time",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler status=\"completed\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval window_time = if(isnotnull(window_time), window_time, 0)\n            | eval execution_latency = max(dispatch_time - (scheduled_time + window_time), 0)\n            | timechart eval(round($exe_lag_agg$(execution_latency), 0)) as latency by $exe_lag_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Latency (seconds)",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 12,
        "kind": "html",
        "title": "Execution Latency Over Time",
        "query": "",
        "base": "",
        "text": "Execution Latency = Dispatch Time - (Scheduled Time + Schedule Window Time)\n        The execution latency expresses the delay in seconds between the planned dispatch time of a search and its actual dispatch time. It takes into account a schedule window if one is configured for this search. Learn More",
        "options": {}
      },
      {
        "row": 13,
        "kind": "table",
        "title": "Count of Skipped Scheduled Reports",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename reason as Reason, savedsearch_name as \"Report Name\", alert_actions as \"Alert Actions\", app as App, user as User, count as Count, percent as \"Percent of Total\"",
        "base": "count_skipped_search_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "none"
        }
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Count of Skipped Reports Over Time",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler status=\"skipped\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval reason = if(isnull(reason) OR reason == \"\", \"none\", reason)\n            | timechart count by $count_skipped_timechart_split_by$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "bottom"
        }
      },
      {
        "row": 14,
        "kind": "table",
        "title": "Count of Skipped Reports by Name and Reason",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler status=\"skipped\"\n            | eval alert_actions = if(isnull(alert_actions) OR alert_actions == \"\", \"none\", alert_actions)\n            | eval reason = if(isnull(reason) OR reason == \"\", \"none\", reason)\n            | stats count AS count values(alert_actions) AS alert_actions by savedsearch_name, reason\n            | eval reason_and_count = reason.\" (\".count.\")\"\n            | stats values(reason_and_count) AS reasons first(alert_actions) AS alert_actions by savedsearch_name\n            | rename reasons AS \"Skip Reason (Skip Count)\" alert_actions AS \"Alert Actions\" savedsearch_name AS \"Report\n            Name\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 14,
        "kind": "table",
        "title": "Scheduler Errors and Warnings",
        "query": "sort - count\n            | eventstats sum(count) AS total\n            | eval percent = round(count / total * 100, 2).\" %\"\n            | fields - total\n            | rename event_message as Message, count as Count, percent as \"Percent of Total\"",
        "base": "count_error_warning_base",
        "text": "",
        "options": {
          "dataOverlayMode": "heatmap",
          "drilldown": "row"
        }
      },
      {
        "row": 15,
        "kind": "event",
        "title": "Scheduler Errors and Warnings Event Details",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=scheduler (log_level=\"ERROR\" OR log_level=\"WARN*\") punct=$warningErrorPunct|s$",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 15,
        "kind": "html",
        "title": "Scheduler Errors and Warnings Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      }
    ],
    "sourceSha256": "023d4c92403f1032e6a1f52b7fd971b38b3a62f327175ed13cc22366eaa12560"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "scheduler_assistant.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_activity_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_activity_deployment",
    "label": "Search Activity: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Search Activity by Instance",
        "query": "| rest splunk_server_group=$role$ splunk_server_group=\"$group$\" /services/server/status/limits/search-concurrency\n| join splunk_server type=outer [\n| rest splunk_server_group=$role$ splunk_server_group=\"$group$\" /services/server/status/resource-usage/splunk-processes\n| eval search_pct_cpu  = if(isnotnull('search_props.sid'), pct_cpu, 0)\n| eval search_mem_used = if(isnotnull('search_props.sid'), mem_used, 0)\n| eventstats sum(search_pct_cpu) as search_pct_cpu, sum(search_mem_used) as search_mem_used by search_props.sid\n| dedup search_props.sid\n| stats dc(search_props.sid) as search_count, sum(search_pct_cpu) as sum_pct_cpu, sum(search_mem_used) as sum_mem_used, sum(eval(('search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\"))) as sum_auto_summary_search, sum(eval('search_props.type'==\"ad-hoc\" AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\"))) as sum_rt_search, sum(eval('search_props.type'==\"ad-hoc\" AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\"))) as sum_hist_search, sum(eval(('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\"))) as sum_rt_scheduled_search, sum(eval(('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\"))) as sum_hist_scheduled_search by splunk_server]\n| eval sum_pct_cpu  = round(sum_pct_cpu, 2)\n| eval sum_mem_used = round(sum_mem_used, 2)\n| sort -search_count, -sum_pct_cpu\n| eval search_count = if(isnull(search_count) OR search_count==\"\", 0, search_count)\n| eval sum_auto_summary_search = if(isnull(sum_auto_summary_search) OR sum_auto_summary_search==\"\", 0, sum_auto_summary_search)\n| eval sum_hist_scheduled_search = if(isnull(sum_hist_scheduled_search) OR sum_hist_scheduled_search==\"\", 0, sum_hist_scheduled_search)\n| eval sum_hist_search = if(isnull(sum_hist_search) OR sum_hist_search==\"\", 0, sum_hist_search)\n| eval sum_rt_scheduled_search = if(isnull(sum_rt_scheduled_search) OR sum_rt_scheduled_search==\"\", 0, sum_rt_scheduled_search)\n| eval sum_rt_search = if(isnull(sum_rt_search) OR sum_rt_search==\"\", 0, sum_rt_search)\n| eval sum_pct_cpu = if(isnull(sum_pct_cpu) OR sum_pct_cpu==\"\", 0, sum_pct_cpu)\n| eval count_cpu = round(sum_pct_cpu / 100.0, 2)\n| eval sum_mem_used = if(isnull(sum_mem_used) OR search_count==\"\", 0, sum_mem_used)\n| eval scheduled_vs_total_auto_summary_search_limit = sum_auto_summary_search.\"/\".max_auto_summary_searches\n| eval scheduled_vs_total_hist_scheduled_search_limit = sum_hist_scheduled_search.\"/\".max_hist_scheduled_searches\n| eval scheduled_vs_total_hist_search_limit = sum_hist_search.\"/\".max_hist_searches\n| eval scheduled_vs_total_rt_scheduled_search_limit = sum_rt_scheduled_search.\"/\".max_rt_scheduled_searches\n| eval scheduled_vs_total_rt_search_limit = sum_rt_search.\"/\".max_rt_searches\n| fields splunk_server, search_count, scheduled_vs_total_auto_summary_search_limit, scheduled_vs_total_hist_scheduled_search_limit, scheduled_vs_total_hist_search_limit, scheduled_vs_total_rt_scheduled_search_limit, scheduled_vs_total_rt_search_limit, count_cpu, sum_mem_used\n| rename splunk_server as Instance, search_count as \"Count of Searches\", scheduled_vs_total_auto_summary_search_limit as \"Summarization\", scheduled_vs_total_hist_scheduled_search_limit as \"Historical Schedule Report\", scheduled_vs_total_hist_search_limit  as \"Historical Search\", scheduled_vs_total_rt_scheduled_search_limit as \"Real-time Schedule Report\",  scheduled_vs_total_rt_search_limit  as \"Real-time Search\", count_cpu as \"CPU Usage (# cores)\", sum_mem_used as \"Memory Usage (MB)\"",
        "base": "",
        "text": "",
        "options": {
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Search Activity by Instance",
        "query": "",
        "base": "",
        "text": "Click on instance name for more details.\n\t\tCPU usage is expressed in total number of CPU cores cumulatively used by search processes.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "viz",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n                    | `dmc_set_bin`\n                    | stats dc(data.search_props.sid) AS distinct_search_count by host, _time\n                    | bin _time minspan=10s\n                    | stats $searchConcurrencyAggrFunc$(distinct_search_count) as search_count by host, _time\n                    | `dmc_search_count_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "height": "375"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n          | `dmc_rename_introspection_fields`\n          | `dmc_set_bin`\n          | stats dc(sid) AS distinct_search_count by host, _time\n          | bin _time minspan=10s\n          | stats $searchConcurrencyAggrFunc$(distinct_search_count) as search_count by host, _time\n          | `dmc_search_count_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.fieldColors": "\n          {\"0\": 0xedf1f6, \n           \"1-5\": 0xdbe3ee, \n           \"6-10\": 0xc9d4e5,\n           \"11-15\": 0xb7c6dc,\n           \"16-20\": 0xa5b8d4,\n           \"21-30\": 0x92aacb,\n           \"31-40\": 0x809cc3,\n           \"41-50\": 0x6e8eba,\n           \"51-75\": 0x5c7fb1,\n           \"76-100\": 0x4a71a9,\n           \"101+\": 0x3863a0\n           }\n        "
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by $searchConcurrencyAggrLabel$ number of concurrent searches over time.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "`dmc_drilldown_search_activity_deployment_search_concurrency(\"$role$\", \"$group$\", $searchConcurrencyAggrFunc$, $drilldown_search_concurrency_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Instances By $searchConcurrencyAggrLabel$ Search Concurrency",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "$searchConcurrencyAggrLabel$ Search Concurrency By Instance",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n          | `dmc_rename_introspection_fields`\n          | `dmc_set_bin`\n          | stats dc(sid) AS distinct_search_count by host, _time\n          | `dmc_timechart` partial=f limit=25 $searchConcurrencyAggrFunc$(distinct_search_count) as search_count by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Search Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "$searchConcurrencyAggrLabel$ Search Concurrency By Instance",
        "query": "",
        "base": "",
        "text": "$searchConcurrencyAggrLabel$ number of concurrent searches over time by instance.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Deployment-Wide $aggrSearchConcurLabel$ Search Concurrency Per Instance Over Time",
        "query": "`dmc_set_index_introspection` search_group=\"$role$\" search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n          | `dmc_set_bin`\n          | stats dc(data.search_props.sid) AS distinct_search_count by host, _time\n          | timechart minspan=10s bins=200 partial=f $aggrSearchConcurFunc$(distinct_search_count) AS distinct_search_count_per_host\n          | eval distinct_search_count_per_host = round(distinct_search_count_per_host, 2)",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.legend.placement": "none",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Search Count"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "viz",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n                    | `dmc_set_bin`\n                    | eval data.search_props.sid = if(component==\"Hostwide\", \"n/a\", 'data.search_props.sid')\n                    | eval data.pid = if(component==\"Hostwide\", \"n/a\", 'data.pid')\n                    | eval data.$resourceType$ = if(component==\"Hostwide\", 0, 'data.$resourceType$')\n                    | stats latest(data.$resourceType$) AS resource_usage_dedup by _time, data.search_props.sid, data.pid, host\n                    | stats sum(resource_usage_dedup) AS sum_resource_usage by _time, host\n                    | eval sum_resource_usage = if(\"data.$resourceType$\" == \"data.pct_cpu\", round(sum_resource_usage / 100.0, 2), sum_resource_usage)\n                    | bin _time minspan=10s\n                    | stats $resourceAggrFunc$(sum_resource_usage) as resource_usage by _time, host\n                    | `dmc_$resourceType$_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "height": "375"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n          | `dmc_rename_introspection_fields`\n          | `dmc_set_bin`\n          | eval sid = if(component==\"Hostwide\", \"n/a\", sid)\n          | eval pid = if(component==\"Hostwide\", \"n/a\", pid)\n          | eval $resourceType$ = if(component==\"Hostwide\", 0, $resourceType$)\n          | stats latest($resourceType$) AS resource_usage_dedup by _time, sid, pid, host\n          | stats sum(resource_usage_dedup) AS sum_resource_usage by _time, host\n          | eval sum_resource_usage = if(\"$resourceType$\" == \"pct_cpu\", round(sum_resource_usage / 100.0, 2), sum_resource_usage)\n          | `dmc_set_bin_for_timechart`\n          | stats $resourceAggrFunc$(sum_resource_usage) as resource_usage by _time, host\n          | `dmc_$resourceType$_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "",
        "base": "",
        "text": "$cpuDocumentationNote$",
        "options": {}
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "`dmc_drilldown_search_activity_deployment_resource_usage(\"$role$\", \"$group$\", $resourceType$, $resourceAggrFunc$, $drilldown_resource_usage_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Instances By $resourceAggrLabel$ Search $resourceTypeLabel$ Usage",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$resourceAggrLabel$ Search $resourceTypeLabel$ Usage By Instance",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage ((component=PerProcess data.search_props.sid::*) OR component=Hostwide)\n          | `dmc_rename_introspection_fields`\n          | `dmc_set_bin`\n          | stats latest($resourceType$) AS resource_usage by _time, sid, pid, host\n          | eval resource_usage = if(\"$resourceType$\" == \"pct_cpu\", round(resource_usage / 100.0, 2), resource_usage)\n          | `dmc_timechart_for_metrics_log` partial=f limit=25 $resourceAggrFunc$(resource_usage) AS resource_usage by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$resourceTypeYLabel$",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "$resourceAggrLabel$ Search $resourceTypeLabel$ Usage By Instance",
        "query": "",
        "base": "",
        "text": "$cpuDocumentationNote$",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Top 20 Memory-Consuming Searches",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$group$\" sourcetype=splunk_resource_usage data.search_props.sid::* data.search_props.mode!=RT\n            | `dmc_rename_introspection_fields`\n            | stats max(elapsed) as runtime max(mem_used) as mem_used earliest(_time) as _time by sid, label, provenance, type, mode, app, role, user, host\n            | eval mem_used = round(mem_used, 2)\n            | sort 20 - mem_used, runtime\n            | fields sid, label, provenance, mem_used, host, runtime, _time, type, mode, app, user, role\n            | eval _time=strftime(_time,\"%+\")\n            | rename sid as SID, label as Name, provenance as Provenance, mem_used as \"Memory Usage (MB)\", host as Instance, runtime as Runtime, _time as Started, type as Type, mode as Mode, app as App, user as User, role as Role\n            | fieldformat Runtime = `dmc_convert_runtime(Runtime)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "rowNumbers": "true"
        }
      }
    ],
    "sourceSha256": "545d36854de46030251a8f9ab6bd71840e4076e0b9090e10f019db0d25cb5a48"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_activity_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_activity_instance",
    "label": "Search Activity: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Ad hoc + Scheduled Searches ($count_total_adhoc_scheduled_search$ Running)",
        "query": "eval total_historical_vs_limit = \"$count_total_hist$\".\"/\".max_hist_searches\n            | fields total_historical_vs_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Ad hoc + Scheduled Searches ($count_total_adhoc_scheduled_search$ Running)",
        "query": "eval total_rt_vs_limit = \"$count_total_rt$\".\"/\".max_rt_searches\n            | fields total_rt_vs_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_hist_scheduled_search_limit = \"$count_hist_scheduled_search$\".\"/\".max_hist_scheduled_searches\n            | fields scheduled_vs_total_hist_scheduled_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_rt_scheduled_search_limit = \"$count_rt_scheduled_search$\".\"/\".max_rt_scheduled_searches\n            | fields scheduled_vs_total_rt_scheduled_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_auto_summary_search_limit = \"$count_auto_summary_search$\".\"/\".max_auto_summary_searches\n            | fields scheduled_vs_total_auto_summary_search_limit",
        "base": "search_concurrency_limits_base",
        "text": "",
        "options": {
          "underLabel": "Summarization",
          "height": "80px",
          "drilldown": "all"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Click to see more details.\n        \n        \n        Search concurrency limits can be set in limits.conf. Learn More",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Ad hoc + Scheduled Historical Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\" OR 'search_props.type'==\"ad-hoc\") AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\")\n            | eval mem_used = round(mem_used, 0)\n            | eval count_cpu = round(pct_cpu / 100.0, 2)\n            | eval elapsed = round(elapsed, 0)\n            | fields search_props.sid, search_props.label, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, count_cpu, elapsed\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", count_cpu as \"CPU Usage (# cores)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Ad hoc + Scheduled Historical Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Ad hoc + Scheduled Real-time Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\" OR 'search_props.type'==\"ad-hoc\") AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\")\n            | eval mem_used = round(mem_used, 0)\n            | eval count_cpu = round(pct_cpu / 100.0, 2)\n            | eval elapsed = round(elapsed, 0)\n            | fields search_props.sid, search_props.label, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, count_cpu, elapsed\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", count_cpu as \"CPU Usage (# cores)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Ad hoc + Scheduled Real-time Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Scheduled Historical Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\")\n            | eval mem_used = round(mem_used, 0)\n            | eval count_cpu = round(pct_cpu / 100.0, 2)\n            | eval elapsed = round(elapsed, 0)\n            | fields search_props.sid, search_props.label, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, count_cpu, elapsed\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", count_cpu as \"CPU Usage (# cores)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Scheduled Historical Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Scheduled Real-time Concurrency Search Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\")\n            | eval mem_used = round(mem_used, 0)\n            | eval count_cpu = round(pct_cpu / 100.0, 2)\n            | eval elapsed = round(elapsed, 0)\n            | fields search_props.sid, search_props.label, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, count_cpu, elapsed\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", count_cpu as \"CPU Usage (# cores)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Scheduled Real-time Concurrency Search Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Summarization Search Details",
        "query": "where ('search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\")\n            | eval mem_used = round(mem_used, 0)\n            | eval count_cpu = round(pct_cpu / 100.0, 2)\n            | eval elapsed = round(elapsed, 0)\n            | fields search_props.sid, search_props.label, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, count_cpu, elapsed\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", count_cpu as \"CPU Usage (# cores)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Summarization Search Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 10,
        "kind": "table",
        "title": "Search Activity",
        "query": "| rest splunk_server=$splunk_server$ /services/server/status/resource-usage/splunk-processes\n| eval search_props.provenance = if(isnull('search_props.provenance') AND isnotnull('search_props.sid'), \"unknown\", 'search_props.provenance')\n| eval search_props.label = if(isnull('search_props.label') AND isnotnull('search_props.sid'), \"N/A\", 'search_props.label')\n| search search_props.sid=* AND pct_cpu=* AND mem_used=*\n| stats dc(search_props.sid) AS Count sum(pct_cpu) as sum_pct_cpu sum(mem_used) as mem_used by search_props.$resourceSnapshotSplitBy$\n| sort -Count -sum_pct_cpu -mem_used\n| eval count_cpu = round(sum_pct_cpu / 100.0, 2)\n| rename app AS App user AS User mode AS Mode type AS Type role AS Role Count as \"Count of Searches\", count_cpu as \"CPU Usage (# cores)\", mem_used as \"Physical Memory Usage (MB)\", search_props.$resourceSnapshotSplitBy$ as \"$resourceSnapshotSplitByLabel$\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "table",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Count",
          "charting.axisTitleY.text": "Count",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false",
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Search Activity",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.\n        CPU usage is expressed in total number of CPU cores cumulatively used by search processes.",
        "options": {}
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Search Activity",
        "query": "",
        "base": "",
        "text": "CPU usage is expressed in total number of CPU cores cumulatively used by search processes.",
        "options": {}
      },
      {
        "row": 12,
        "kind": "chart",
        "title": "$concurrencyFuncLabel$ Search Concurrency",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | stats dc(sid) AS distinct_search_count by _time, $concurrencySplitBy$\n        | `dmc_timechart` $concurrencyFunction$(distinct_search_count) AS \"$concurrencyFunction$ of search concurrency\" by $concurrencySplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Count"
        }
      },
      {
        "row": 12,
        "kind": "html",
        "title": "$concurrencyFuncLabel$ Search Concurrency",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "$resourceFuncLabel$ Resource Usage of Searches",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | stats latest($resourceType$) AS resource_usage_dedup by _time, $resourceSplitBy$, sid, pid\n        | stats sum(resource_usage_dedup) AS sum_resource_usage by _time,  $resourceSplitBy$\n        | eval sum_resource_usage = if(\"$resourceType$\" == \"pct_cpu\", round(sum_resource_usage / 100.0, 2), sum_resource_usage)\n        | `dmc_timechart` $resourceFunction$(sum_resource_usage) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "$usageYAxis$"
        }
      },
      {
        "row": 13,
        "kind": "html",
        "title": "$resourceFuncLabel$ Resource Usage of Searches",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.\n        $cpuDisplayMsg$",
        "options": {}
      },
      {
        "row": 13,
        "kind": "html",
        "title": "$resourceFuncLabel$ Resource Usage of Searches",
        "query": "",
        "base": "",
        "text": "$cpuDisplayMsg$",
        "options": {}
      },
      {
        "row": 14,
        "kind": "table",
        "title": "Top 20 Memory-Consuming Searches",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage data.search_props.sid::* data.search_props.mode!=RT\n        | `dmc_rename_introspection_fields`\n        | stats max(elapsed) as runtime max(mem_used) as mem_used earliest(_time) as _time by sid, label, provenance, type, mode, app, role, search_head, user\n        | eval mem_used = round(mem_used, 2)\n        | sort 20 - mem_used\n        | fields - day, hour, minute, second\n        | eval _time = strftime(_time,\"%+\")\n        | rename sid as SID, label as \"Search Name\", provenance AS Provenance, type as Type, mode as Mode, app as App, role as Role, search_head as \"Search Head\", user as User, mem_used as \"Memory Usage (MB)\", _time as Started, runtime as Runtime\n        | fieldformat Runtime = `dmc_convert_runtime(Runtime)`",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "count": "10"
        }
      },
      {
        "row": 14,
        "kind": "html",
        "title": "Top 20 Memory-Consuming Searches",
        "query": "",
        "base": "",
        "text": "Click on a SID to see more details",
        "options": {}
      },
      {
        "row": 14,
        "kind": "table",
        "title": "Details of SID: $top10_drilldown_sid$",
        "query": "`dmc_set_index_audit` action=search sourcetype=audittrail\n [ localop | stats count\n   | eval search_id = replace(\"$top10_drilldown_sid$\", \"^remote_[^_]*_\", \"\")\n   | table search_id ]\n [ localop | stats count\n   | eval earliest = $top10_drilldown_earliest$ - 86400\n   | table earliest ]\n [ localop | stats count\n   | eval host = if(like(\"$top10_drilldown_sid$\", \"remote_%\"), \"*\", \"$host$\")\n   | table host ]\n latest=\"$top10_drilldown_latest$\"\n| stats values(savedsearch_name) AS search_name values(result_count) AS result_count values(event_count) AS event_count values(scan_count) AS scan_count values(total_run_time) AS search_run_time values(host) as host values(search) AS search_string by search_id\n| transpose\n| rename column as Property, \"row 1\" as Value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "off",
          "wrap": "true"
        }
      },
      {
        "row": 14,
        "kind": "html",
        "title": "Details of SID: $top10_drilldown_sid$",
        "query": "",
        "base": "",
        "text": "Please try to choose a larger time range if this panel produces no result.\n         \n        Close this panel",
        "options": {}
      },
      {
        "row": 15,
        "kind": "chart",
        "title": "Searches Started Per Minute by Dispatcher",
        "query": "$dispatcher$ host=$host$\n| eval dispatcher = case(isnotnull(server) AND sourcetype==\"splunkd_remote_searches\", server, isnull(server) AND sourcetype==\"splunkd_remote_searches\", \"unknown\", sourcetype==\"audittrail\", \"local instance\")\n| bin _time\n| stats count by _time, dispatcher\n| timechart limit=50 per_minute(count) AS \"New searches per minute\" by dispatcher",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "New searches/minute",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 15,
        "kind": "html",
        "title": "Searches Started Per Minute by Dispatcher",
        "query": "",
        "base": "",
        "text": "This graph shows the number of searches newly dispatched every minute, grouped by instance that originally dispatched the search. The value \"local instance\" means that the search originated locally, as opposed to being dispatched by a remote search-head.",
        "options": {}
      },
      {
        "row": 16,
        "kind": "chart",
        "title": "Aggregate Search Runtime",
        "query": "`dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage component=PerProcess data.search_props.sid::*\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | stats max(elapsed) as ELAPSED by sid $runtimeSplitBy$ _time\n        | streamstats current=t global=f window=2 earliest(ELAPSED) as prev_ELAPSED latest(ELAPSED) as curr_ELAPSED by sid $runtimeSplitBy$\n        | eval `dmc_collection_interval`\n        | eval delta_ELAPSED = curr_ELAPSED - prev_ELAPSED\n        | eval runtime = if(delta_ELAPSED = 0, min(curr_ELAPSED, collection_interval), delta_ELAPSED)\n        | `dmc_timechart` sum(runtime) by $runtimeSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "Runtime (seconds)",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 16,
        "kind": "html",
        "title": "Aggregate Search Runtime",
        "query": "",
        "base": "",
        "text": "Mode can be historical, historical batch, RT, or RT indexed.",
        "options": {}
      }
    ],
    "sourceSha256": "2f9a005baf204864643354a6f5571ac5e1d02cfe349dbc1316486c4a1c3eb4df"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_usage_statistics_deployment",
    "label": "Search Usage Statistics: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Search Heads"
          }
        ]
      },
      {
        "type": "time",
        "token": "time",
        "label": "Time Range:",
        "default": "Last 4 hours",
        "choices": []
      },
      {
        "type": "radio",
        "token": "filter_out_non_adhoc",
        "label": "Only Ad Hoc Searches",
        "default": "search_type=\"ad hoc\"",
        "choices": [
          {
            "value": "search_type=\"ad hoc\"",
            "label": "Yes"
          },
          {
            "value": "true()",
            "label": "No"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Search Activity by User ($user_count$)",
        "query": "stats dc(host) as count_host, median(total_run_time) as median_runtime, sum(total_run_time) as cum_runtime, count(search) as count, max(_time) as last_use by user\n            | eval median_runtime = if(isnotnull(median_runtime), median_runtime, \"-\")\n            | eval cum_runtime = if(isnotnull(cum_runtime), cum_runtime, \"-\")\n            | `dmc_time_format(last_use)`\n            | fields user, count, count_host, median_runtime, cum_runtime, last_use\n            | sort - count\n            | rename user as User, count_host as \"Search Head Count\", count as \"Search Count\", median_runtime as \"Median Runtime\", cum_runtime as \"Cumulative Runtime\", last_use as \"Last Search\"\n            | fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n            | fieldformat \"Cumulative Runtime\" = `dmc_convert_runtime('Cumulative Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Search Activity by User ($user_count$)",
        "query": "",
        "base": "",
        "text": "Click to see a list of search head names and a list of search strings.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Search Heads Used by $user_drilldown_hosts$",
        "query": "search user=$user_drilldown_hosts$\n            | stats count(search) as count by host\n            | sort - count\n            | fields host, count\n            | rename host as \"Search Head\", count as \"Search Count\"",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Search Heads Used by $user_drilldown_hosts$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Searches by $user_drilldown_searches$",
        "query": "search user=$user_drilldown_searches$\n            | stats count by search\n            | sort - count\n            | fields count, search\n            | rename search as \"Report Name/Search String\", count as \"Count\"",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Searches by $user_drilldown_searches$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Search Activity by Search Head ($search_head_count$)",
        "query": "stats median(total_run_time) as median_runtime sum(total_run_time) as cum_runtime count(search) as count_search max(_time) as last_use dc(user) as count_user by host\n            | eval median_runtime = if(isnotnull(median_runtime), median_runtime, \"-\")\n            | eval cum_runtime = if(isnotnull(cum_runtime), cum_runtime, \"-\")\n            | `dmc_time_format(last_use)`\n            | fields host, count_search, count_user, median_runtime, cum_runtime, last_use\n            | sort - count_search\n            | rename host as \"Search Head\", count_search as \"Search Count\", count_user as \"User Count\", median_runtime as \"Median Runtime\", cum_runtime as \"Cumulative Runtime\", last_use as \"Last Search\"\n            | fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n            | fieldformat \"Cumulative Runtime\" = `dmc_convert_runtime('Cumulative Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Search Activity by Search Head ($search_head_count$)",
        "query": "",
        "base": "",
        "text": "Click to see a list of users and a list of search strings.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Users on $host_drilldown_users$",
        "query": "search host=$host_drilldown_users|s$\n            | stats count(search) as count by user\n            | sort - count\n            | fields user, count\n            | rename user as \"User\", count as \"Count\"",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Users on $host_drilldown_users$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Searches on $host_drilldown_searches$",
        "query": "search host=$host_drilldown_searches|s$\n            | stats count by search\n            | sort - count        \n            | fields count, search\n            | rename search as \"Report Name/Search String\", count as \"Count\"",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Searches on $host_drilldown_searches$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Frequently Run Searches",
        "query": "search user=\"*\"\n            | stats count(search) as count, median(total_run_time) as median_runtime, max(total_run_time) as max_runtime, values(user) as user, values(host) as host, values(search_type) as search_type by search\n            | eval median_runtime = if(isnotnull(median_runtime), median_runtime, \"-\")\n            | eval max_runtime = if(isnotnull(max_runtime), max_runtime, \"-\")\n            | sort - count\n            | rename search as \"Report Name/Search String\", count as \"Count\", median_runtime as \"Median Runtime\", max_runtime as \"Max Runtime\", user as Users, host as Hosts, search_type as Type\n            | fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n            | fieldformat \"Max Runtime\" = `dmc_convert_runtime('Max Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Long-running Searches",
        "query": "search user=\"*\" search=\"*\"\n            | eval earliest = case(like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\", like(apiStartTime, \"%ZERO_TIME%\"), \"-\", 1 == 1, apiStartTime )\n            | eval latest = case(like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\", like(apiEndTime, \"%ZERO_TIME%\"), \"-\", 1 == 1, apiEndTime ) \n            | `dmc_time_format(_time)`\n            | stats max(total_run_time) as total_run_time by search, _time, earliest, latest, search_type, user, host, search_id\n            | sort - total_run_time \n            | eval total_run_time = if(isnotnull(total_run_time), total_run_time, \"-\")\n            | fields search, total_run_time, _time, earliest, latest, search_type, user, host, search_id\n            | rename search as \"Report Name/Search String\", total_run_time as \"Search Runtime\", _time as \"Search Start\", earliest as \"Earliest Time\", latest as \"Latest Time\", search_type as Type, user as \"User\", host as \"Host\", search_id as SID\n            | fieldformat \"Search Runtime\" = `dmc_convert_runtime('Search Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Long-running Searches",
        "query": "",
        "base": "",
        "text": "Click to see detail",
        "options": {}
      },
      {
        "row": 5,
        "kind": "event",
        "title": "Long-running Searches",
        "query": "where search_id=$long_running_sid|s$",
        "base": "get_audit_base",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Long-running Searches",
        "query": "",
        "base": "",
        "text": "Close event view",
        "options": {}
      }
    ],
    "sourceSha256": "d28972b8dd9c235486032c21d267a14431138e451dbcaad972887da3b196f400"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_usage_statistics_instance.env_cloud",
    "label": "Search Usage Statistics",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "time",
        "label": "Time Range:",
        "default": "Last 4 hours",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Search Activity by User",
        "query": "splunk_server=local `dmc_audit_get_searches($host$)`\n| stats min(_time) as _time values(user) as user max(total_run_time) as total_run_time first(search) as search by search_id\n| chart median(total_run_time) as median_runtime Perc90(total_run_time) as Perc90_runtime sum(total_run_time) as cum_runtime count as count max(_time) as last_use by user\n| eval last_use = strftime(last_use, \"%F %T\")\n| fields user, count, median_runtime, Perc90_runtime, cum_runtime, last_use\n| rename user as User, count as \"Search Count\", median_runtime as \"Median Runtime\", Perc90_runtime as \"90th Percentile Runtime\", cum_runtime as \"Cumulative Runtime\", last_use as \"Last Search\"\n| fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n| fieldformat \"90th Percentile Runtime\" = `dmc_convert_runtime('90th Percentile Runtime')`\n| fieldformat \"Cumulative Runtime\" = `dmc_convert_runtime('Cumulative Runtime')`",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Common Searches",
        "query": "splunk_server=local `dmc_audit_get_searches($host$)`\n| $common_search_user_filter$\n| stats min(_time) as _time values(user) as user max(total_run_time) as total_run_time first(search) as search by search_id\n| stats count median(total_run_time) as median_runtime max(total_run_time) as max_runtime values(user) as user by search\n| eval median_runtime=if(isnotnull(median_runtime), median_runtime, \"-\")\n| eval max_runtime=if(isnotnull(max_runtime), max_runtime, \"-\")\n| sort - count\n| rename search as \"Search\", count as \"Count\", median_runtime as \"Median Runtime\", max_runtime as \"Max Runtime\", user as User\n| fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n| fieldformat \"Max Runtime\" = `dmc_convert_runtime('Max Runtime')`",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Long-Running Searches",
        "query": "splunk_server=local `dmc_audit_get_searches($host$)`\n| $long_running_search_user_filter$\n| eval is_scheduled = if(search_id LIKE \"scheduler%\", \"yes\", \"no\")\n| stats min(_time) as _time, values(user) as user, max(total_run_time) as total_run_time, first(search) as search, first(is_scheduled) as is_scheduled, first(apiStartTime) as apiStartTime, first(apiEndTime) as apiEndTime by search_id\n| fields search, total_run_time, _time, apiStartTime, apiEndTime, is_scheduled, user\n| eval earliest = case(\n    like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\",\n    like(apiStartTime, \"%ZERO_TIME%\"), \"-\",\n    1 == 1, apiStartTime\n)\n| eval latest = case(\n    like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\",\n    like(apiEndTime, \"%ZERO_TIME%\"), \"-\",\n    1 == 1, apiEndTime\n)\n| eval search = if(isnotnull(search), search, \"N/A\")\n| `dmc_time_format(_time)`\n| sort - total_run_time\n| fields search, total_run_time, _time, earliest, latest, is_scheduled, user\n| rename search as Search, total_run_time as \"Search Runtime\", _time as \"Search Start\", earliest as \"Earliest Time\", latest as \"Latest Time\", is_scheduled as \"Scheduled\", user as \"User\"\n| fieldformat \"Search Runtime\" = `dmc_convert_runtime('Search Runtime')`",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Common Search Commands",
        "query": "splunk_server=local `dmc_audit_get_searches($host$)`\n| stats min(_time) as _time first(user) as user max(total_run_time) as total_run_time first(search) as search by search_id\n| eval commands = commands(search)\n| streamstats window=1 values(commands) as commands\n| stats count avg(total_run_time) as avg_runtime max(total_run_time) as max_runtime by commands\n| eval avg_runtime = round(avg_runtime, 2)\n| eval max_runtime = round(max_runtime, 2)\n| sort - count, - max_runtime, - avg_runtime\n| rename commands as Command, avg_runtime as \"Average Runtime\", max_runtime as \"Max Runtime\", count as \"Count\"\n| fieldformat \"Average Runtime\" = `dmc_convert_runtime('Average Runtime')`\n| fieldformat \"Max Runtime\" = `dmc_convert_runtime('Max Runtime')`",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "20"
        }
      }
    ],
    "sourceSha256": "e17158aaf28895f7823d595e533edde01dd24ea3fe44659eb17d4fa3f5a974af"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_usage_statistics_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "search_usage_statistics_instance",
    "label": "Search Usage Statistics: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "All Search Heads"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "time",
        "token": "time",
        "label": "Time Range:",
        "default": "Last 4 hours",
        "choices": []
      },
      {
        "type": "radio",
        "token": "filter_out_non_adhoc",
        "label": "Only Ad Hoc Searches",
        "default": "search_type=\"ad hoc\"",
        "choices": [
          {
            "value": "search_type=\"ad hoc\"",
            "label": "Yes"
          },
          {
            "value": "true()",
            "label": "No"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Search Activity by User ($user_count$)",
        "query": "| stats median(total_run_time) as median_runtime Perc90(total_run_time) as Perc90_runtime sum(total_run_time) as cum_runtime count(search) as count max(_time) as last_use by user\n            | eval last_use = strftime(last_use, \"%F %T\")\n            | fields user, count, median_runtime, Perc90_runtime, cum_runtime, last_use\n            | rename user as User, count as \"Search Count\", median_runtime as \"Median Runtime\", Perc90_runtime as \"90th Percentile Runtime\", cum_runtime as \"Cumulative Runtime\", last_use as \"Last Search\"\n            | fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n            | fieldformat \"90th Percentile Runtime\" = `dmc_convert_runtime('90th Percentile Runtime')`\n            | fieldformat \"Cumulative Runtime\" = `dmc_convert_runtime('Cumulative Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Frequently Run Searches",
        "query": "$common_search_user_filter$\n            | stats count median(total_run_time) as median_runtime max(total_run_time) as max_runtime values(user) as user by search\n            | eval median_runtime=if(isnotnull(median_runtime), median_runtime, \"-\")\n            | eval max_runtime=if(isnotnull(max_runtime), max_runtime, \"-\")\n            | sort - count\n            | rename search as \"Search\", count as \"Count\", median_runtime as \"Median Runtime\", max_runtime as \"Max Runtime\", user as User\n            | fieldformat \"Median Runtime\" = `dmc_convert_runtime('Median Runtime')`\n            | fieldformat \"Max Runtime\" = `dmc_convert_runtime('Max Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Long-running Searches",
        "query": "$long_running_search_user_filter$\n| fields search, total_run_time, _time, apiStartTime, apiEndTime, search_type, user\n| eval earliest = case(\n    like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\",\n    like(apiStartTime, \"%ZERO_TIME%\"), \"-\",\n    1 == 1, apiStartTime\n)\n| eval latest = case(\n    like(apiStartTime, \"%ZERO_TIME%\") AND like(apiEndTime, \"%ZERO_TIME%\"), \"all time\",\n    like(apiEndTime, \"%ZERO_TIME%\"), \"-\",\n    1 == 1, apiEndTime\n)\n| eval search = if(isnotnull(search), search, \"N/A\")\n| `dmc_time_format(_time)`\n| sort - total_run_time\n| fields search, total_run_time, _time, earliest, latest, search_type, user\n| rename search as Search, total_run_time as \"Search Runtime\", _time as \"Search Start\", earliest as \"Earliest Time\", latest as \"Latest Time\", search_type as Type, user as \"User\"\n| fieldformat \"Search Runtime\" = `dmc_convert_runtime('Search Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Common Search Commands",
        "query": "eval commands = commands(search)\n| streamstats window=1 values(commands) as commands\n| stats count avg(total_run_time) as avg_runtime max(total_run_time) as max_runtime by commands\n| eval avg_runtime = round(avg_runtime, 2)\n| eval max_runtime = round(max_runtime, 2)\n| sort - count, - max_runtime, - avg_runtime\n| rename commands as Command, avg_runtime as \"Average Runtime\", max_runtime as \"Max Runtime\", count as \"Count\"\n| eval \"Average Runtime\" = `dmc_convert_runtime('Average Runtime')`\n| eval \"Max Runtime\" = `dmc_convert_runtime('Max Runtime')`",
        "base": "get_audit_base",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "20"
        }
      }
    ],
    "sourceSha256": "0076a8332869ac41d2b4580a0099f711ea0b4220f05e27373afdaeccd159fe01"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_app_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_app_deployment",
    "label": "Search Head Clustering: App Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Search Head Cluster:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Apps Status",
        "query": "| rest /services/apps/local splunk_server_group=\"$group$\" splunk_server_group=dmc_group_search_head\n| search install_source_checksum=*\n| fields title, label, splunk_server, install_source_checksum\n| rename title as app_name, install_source_checksum as checksum\n  | append [ | rest /services/apps/deploy splunk_server_group=\"$group$\" splunk_server_group=dmc_group_shc_deployer\n  | fields title, splunk_server, checksum\n| rename title as app_name]\n| stats values(checksum) as checksum, values(label) as label by app_name\n| eval status = if(mvcount(checksum) > 1, \"Out of Synchronization!\", \"Synchronized\")\n| fields label status app_name\n| rename label as App, status as \"Status\"\n| sort status",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Apps Status",
        "query": "",
        "base": "",
        "text": "This panel shows the status of apps pushed by deployer to search head cluster members.\n        Synchronized: all members have the latest version of the app.\n        Out of Synchronization: one or more members does not have the latest version of the app.\n        Click on a row to see more details.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "$appLocalDrilldownLabel$",
        "query": "| rest /services/apps/local splunk_server_group=\"$group$\" splunk_server_group=dmc_group_search_head\n| search install_source_checksum=* AND title=\"$appLocalDrilldown$\"\n| fields splunk_server, install_source_checksum\n| rename splunk_server as Instance, install_source_checksum as Checksum",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "$appLocalDrilldownLabel$",
        "query": "| rest /services/apps/deploy splunk_server_group=\"$group$\" splunk_server_group=dmc_group_shc_deployer\n| search title=\"$appLocalDrilldown$\"\n| fields splunk_server, checksum\n| rename splunk_server as Instance, checksum as Checksum",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "html",
        "title": "$appLocalDrilldownLabel$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "App Deployment Requests",
        "query": "$deploymentRequestStatusScope$\n| $deploymentRequestStatusScope$\n| `dmc_timechart` $deploymentRequestMetric$ $deploymentRequestSplitBy$",
        "base": "deploymentRequestBaseSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "$deploymentRequestYLabel$",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "App Deployment Requests",
        "query": "",
        "base": "",
        "text": "This panel shows the number of app push requests made by user.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Count of App Deployment Actions on the Deployer",
        "query": "$sendDeployableAppsStatusFilter$\n| $sendDeployableAppsTargetFilter$\n| `dmc_timechart` count by $sendDeployableAppsSplitBy$",
        "base": "sendDeployableAppsStatusBaseSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Count of App Deployment Actions on the Deployer",
        "query": "",
        "base": "",
        "text": "This panel shows the activities on the deployer.",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Count of App Deployment Actions by Search Head Cluster Members",
        "query": "`dmc_set_index_internal` search_group=\"$group$\" sourcetype=splunkd_conf component=ConfDeployment data.task=downloadDeployableApps\n            | table _time, data.apps{}.action, data.apps{}.name, host\n            | eval apps = mvzip('data.apps{}.action', 'data.apps{}.name', \",\")\n            | mvexpand apps\n            | rex field=apps \"(?<action>\\w+),(?<app_name>.+)\"\n            | fields _time, host, action, app_name\n            | where action!=\"preserved\"\n            | $actionFilter$\n            | $appNameFilter$\n            | $hostFilter$\n            | timechart count(action) as count_action by $appDeploymentSplitBy$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Count of App Deployment Actions by Search Head Cluster Members",
        "query": "",
        "base": "",
        "text": "This panel shows the activities by search head cluster members.",
        "options": {}
      }
    ],
    "sourceSha256": "6e46ffd504b0f7e10ff93659ad88082de7747b8e25aef09f84ff79346ac1df0c"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_artifact_replication.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_artifact_replication",
    "label": "Search Head Clustering: Artifact Replication",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Search Head Cluster:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Warning and Error Patterns",
        "query": "`dmc_get_warnings_and_errors(\"$group$\", *Artifact*)`\n| cluster showcount=t\n| table cluster_count, _time, log_level, component, event_message, punct\n| sort - cluster_count\n| `dmc_time_format(_time)`\n| rename cluster_count AS Count, _time AS \"Latest Time\", log_level as \"Log Level\", component as Component, event_message as \"Latest Message\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Warning and Error Patterns",
        "query": "",
        "base": "",
        "text": "Click on a row to see event details.",
        "options": {}
      },
      {
        "row": 0,
        "kind": "event",
        "title": "Event Details",
        "query": "`dmc_get_warnings_and_errors(\"$group$\", *Artifact*)` punct=\"$warningErrorPunct$\"",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Count of Artifacts ($countArtifacts$)",
        "query": "$count_artifact_status_filter$\n            | $count_artifact_member_filter$\n            | $count_artifact_app_filter$\n            | $count_artifact_search_name_filter$\n            | $count_artifact_user_filter$\n            | stats count by $count_artifact_split_by$",
        "base": "artifact_snapshot_base_search",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "refresh.auto.interval": "60",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Count of Artifacts ($countArtifacts$)",
        "query": "",
        "base": "",
        "text": "Click on pie chart for more details.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Artifacts ($count_artifact_drilldown_value2$): $count_artifact_drilldown_name$ = $count_artifact_drilldown_value$",
        "query": "$count_artifact_status_filter$\n            | $count_artifact_member_filter$\n            | search $count_artifact_drilldown_name$ = \"$count_artifact_drilldown_value$\"",
        "base": "artifact_snapshot_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Artifacts ($count_artifact_drilldown_value2$): $count_artifact_drilldown_name$ = $count_artifact_drilldown_value$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Median Count of Artifacts to Replicate",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=subtask_counts name=shccaptain_artifact search_group=\"$group$\"\n| `dmc_timechart_for_metrics_log` median(to_fix_rep_factor) as artifacts",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "none",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Artifact Replication Job Activity",
        "query": "`dmc_set_index_internal` sourcetype=splunkd group=executor name=poolmember_executor search_group=\"$group$\"\n| eval backlog_change = jobs_added - jobs_finished\n| `dmc_timechart_for_metrics_log` sum(jobs_added) AS \"jobs added\" sum(jobs_finished) AS \"jobs finished\" sum(backlog_change) AS \"backlog change\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.overlayFields": "\"backlog change\"",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto"
        }
      }
    ],
    "sourceSha256": "ea7fde0000a9961649d1ff8c39c440379defe220e0fb175930b2c266a8616b8c"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_conf_rep.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_conf_rep",
    "label": "Search Head Clustering: Configuration Replication",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Search Head Cluster:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$common_baseline_text_unhealthy$ click to see more details. Learn More",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$common_baseline_text_healthy$",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Warning and Error Patterns",
        "query": "`dmc_get_warnings_and_errors(\"$group$\", ConfReplication*)`\n| cluster showcount=t\n| table cluster_count, _time, log_level, component, event_message, punct\n| sort - cluster_count\n| `dmc_time_format(_time)`\n| rename cluster_count AS Count, _time AS \"Latest Time\", log_level as \"Log Level\", component as Component, event_message as \"Latest Message\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Warning and Error Patterns",
        "query": "",
        "base": "",
        "text": "Click on a row to see event details.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "event",
        "title": "Event Details",
        "query": "`dmc_get_warnings_and_errors(\"$group$\", ConfReplication*)` punct=\"$warningErrorPunct$\"",
        "base": "",
        "text": "",
        "options": {
          "rowNumbers": "true"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "Event Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Configuration Replication Activity",
        "query": "$confOpAppScope$\n            | $confOpOperationTypeScope$\n            | $confOpObjTypeScope$\n            | $confOpObjNameScope$\n            | $confOpOwnerScope$\n            | $confOpHostScope$\n            | timechart count by $confOpBy$ usenull=f",
        "base": "confOpSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleY.text": "Operation Count",
          "charting.axisTitleX.text": "Time",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Configuration Replication Activity",
        "query": "fields - count\n| $confOpOperationTypeScope$\n| $confOpObjTypeScope$\n| $confOpObjNameScope$\n| $confOpOwnerScope$\n| $confOpHostScope$\n| sort - _time\n| rename _time as Time, host as Instance, optype_desc as \"Operation Type\", object_name as \"Object Name\", object_type as \"Object Type\", app as App, owner as Owner\n| `dmc_time_format(Time)`",
        "base": "confOpSearch",
        "text": "",
        "options": {
          "drilldown": "off"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Configuration Replication Performance",
        "query": "`dmc_timechart_for_metrics_log` sum(count) as count latest(eval(sum_total_time / count)) as avg_time_per_action latest(max_max_time) as max_time_per_action",
        "base": "confRepPerfSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.overlayFields": "count",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto",
          "charting.axisTitleY2.text": "Count of Actions",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Count of Actions Over Time",
        "query": "$confRepPerfCountHostScope$\n| $confRepPerfCountActionScope$\n| `dmc_timechart_for_metrics_log` sum(count) by $confRepPerfCountSplitBy$",
        "base": "confRepPerfSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Time Spent on Actions Over Time",
        "query": "$confRepPerfTimeHostScope$\n| $confRepPerfTimeActionScope$\n| `dmc_timechart_for_metrics_log` $confRepPerfMetric$ by $confRepPerfTimeSplitBy$",
        "base": "confRepPerfSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Time Spent (ms)",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Definitions for these actions are available in our online documentation. Learn more.",
        "options": {}
      }
    ],
    "sourceSha256": "5ee69ca234a2932f02c74a41a1b6d97dbbccb8c9c6a8b14b035db7a8b2faf570"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_scheduler_delegation_statistics.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_scheduler_delegation_statistics",
    "label": "Search Head Clustering: Scheduler Delegation",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Search Head Cluster:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Scheduler Delegation Count",
        "query": "stats count by $jobsSplitBy$",
        "base": "jobsSnapshotBaseSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "pie",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "none",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Scheduler Delegation Activity",
        "query": "$jobStateFilter$\n| $jobSidFilter$\n| $jobSavedSearchNameFilter$\n| `dmc_time_format(dispatch_time)`\n| sort - dispatch_time\n| fields dispatch_time, job_state, success, splunk_server, peer, saved_search, savedsearchtype, search_app, search_owner, sid\n| eval success = if (success == 1 or success == \"1\", \"Succeeded\", \"Failed\")\n| rename dispatch_time as \"Dispatch Time\", job_state as \"Job State\", success as Success, splunk_server as \"Delegating Instance (Captain)\" peer as \"Delegated Instance\", saved_search as \"Scheduled Search\", savedsearchtype as \"Saved Search Type\", search_app as App, search_owner as Owner, sid as SID",
        "base": "jobsSnapshotBaseSearch",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "10",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Scheduler Activity",
        "query": "fields - delegated_waiting delegated_scheduled max_pending max_running",
        "base": "getSchedulerData",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Scheduler Activity",
        "query": "",
        "base": "",
        "text": "dispatched: The number of scheduled search jobs that the captain successfully dispatched to members.\n        skipped: The number of jobs that were skipped and not dispatched.\n        delegated: The number of jobs that the captain attempted to dispatch. This is usually the same as the number of dispatched jobs.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Scheduler Status",
        "query": "fields - dispatched skipped delegated",
        "base": "getSchedulerData",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Scheduler Status",
        "query": "",
        "base": "",
        "text": "delegated_waiting: The number of jobs currently running on members.\n        delegated_scheduled: The number of jobs that the captain is trying to contact members to start running. This is usually 0, unless the captain or network is backed up.\n        max_pending: The number of jobs pending over a 30 second period.",
        "options": {}
      }
    ],
    "sourceSha256": "e6225475008965b72787c1397c184695c016512bc3f586604146cd6472a4de92"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_status_and_conf.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "shc_status_and_conf",
    "label": "Search Head Clustering: Status and Configuration",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Search Head Cluster:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$member_heartbeat_text_unhealthy$ click to see more detail.",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$member_heartbeat_text_healthy$",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$member_peer_inconsistency_text$ click to see more detail.",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$common_baseline_text_unhealthy$ Scroll down to see member status. Learn More",
        "options": {}
      },
      {
        "row": 0,
        "kind": "html",
        "title": "Health Check",
        "query": "",
        "base": "",
        "text": "$common_baseline_text_healthy$",
        "options": {}
      },
      {
        "row": 0,
        "kind": "table",
        "title": "Members that exceeded heartbeat timeout",
        "query": "fields label, last_heartbeat, last_heartbeat_captain, heartbeat_timeout, status, unable_to_connect\n            | eval heartbeat_timeout = if(isnotnull(heartbeat_timeout), heartbeat_timeout, \"N/A\")\n            | `dmc_time_format(last_heartbeat)`\n            | `dmc_time_format(last_heartbeat_captain)`\n            | eval last_heartbeat = if(isnotnull(last_heartbeat), last_heartbeat, \"N/A\")\n            | rename label as Member, last_heartbeat as \"Last Heartbeat Sent to Captain\", last_heartbeat_captain as \"Last Heartbeat Received by Captain\", heartbeat_timeout as \"Heartbeat Timeout (sec)\", status as \"Status\", unable_to_connect as \"Member Unreachable\"",
        "base": "members_heartbeat_timeout_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 0,
        "kind": "table",
        "title": "Search Head Cluster Members and Peers",
        "query": "",
        "base": "member_peer_consistency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Ad hoc + Scheduled Searches ($count_total_adhoc_scheduled_search$ Running)",
        "query": "eval total_historical_vs_limit = count_total_hist.\"/\".max_hist_searches\n            | fields total_historical_vs_limit",
        "base": "search_concurrency_vs_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "drilldown": "all"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Ad hoc + Scheduled Searches ($count_total_adhoc_scheduled_search$ Running)",
        "query": "eval total_rt_vs_limit = count_total_rt.\"/\".max_rt_searches\n            | fields total_rt_vs_limit",
        "base": "search_concurrency_vs_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "drilldown": "all"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_hist_scheduled_search_limit = count_hist_scheduled_search.\"/\".max_hist_scheduled_searches\n            | fields scheduled_vs_total_hist_scheduled_search_limit",
        "base": "search_concurrency_vs_limits_base",
        "text": "",
        "options": {
          "underLabel": "Historical",
          "drilldown": "all"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_rt_scheduled_search_limit = count_rt_scheduled_search.\"/\".max_rt_scheduled_searches\n            | fields scheduled_vs_total_rt_scheduled_search_limit",
        "base": "search_concurrency_vs_limits_base",
        "text": "",
        "options": {
          "underLabel": "Real-time",
          "drilldown": "all"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Scheduled Searches ($count_total_scheduled_search$ Running)",
        "query": "eval scheduled_vs_total_auto_summary_search_limit = count_auto_summary_search.\"/\".max_auto_summary_searches\n            | fields scheduled_vs_total_auto_summary_search_limit",
        "base": "search_concurrency_vs_limits_base",
        "text": "",
        "options": {
          "underLabel": "Summarization",
          "drilldown": "all"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Click to see more details.\n        \n        \n          Search concurrency limits can be set in limits.conf. Learn More",
        "options": {}
      },
      {
        "row": 6,
        "kind": "table",
        "title": "Ad hoc + Scheduled Historical Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\" OR 'search_props.type'==\"ad-hoc\") AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\")\n            | fields search_props.sid, search_props.label, splunk_server, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", splunk_server as Member, search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Ad hoc + Scheduled Historical Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "Ad hoc + Scheduled Real-time Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\" OR 'search_props.type'==\"ad-hoc\") AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\")\n            | fields search_props.sid, search_props.label, splunk_server, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", splunk_server as Member, search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "Ad hoc + Scheduled Real-time Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Scheduled Historical Search Concurrency Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"historical\" OR 'search_props.mode'==\"historical batch\")\n            | fields search_props.sid, search_props.label, splunk_server, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", splunk_server as Member, search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Scheduled Historical Search Concurrency Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Scheduled Real-time Concurrency Search Details",
        "query": "where ('search_props.type'==\"scheduled\" OR 'search_props.type'==\"summary indexing\" OR 'search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\") AND ('search_props.mode'==\"RT\" OR 'search_props.mode'==\"RT indexed\")\n            | fields search_props.sid, search_props.label, splunk_server, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", splunk_server as Member, search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Scheduled Real-time Concurrency Search Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 10,
        "kind": "table",
        "title": "Summarization Search Details",
        "query": "where ('search_props.type'==\"report acceleration\" OR 'search_props.type'==\"datamodel acceleration\")\n            | fields search_props.sid, search_props.label, splunk_server, search_props.app, search_props.user, search_props.type, search_props.mode, search_props.role, mem_used, pct_cpu, elapsed\n            | eval mem_used = round(mem_used, 0)\n            | eval pct_cpu = round(pct_cpu, 0)\n            | eval elapsed = round(elapsed, 0)\n            | rename search_props.sid as SID, search_props.label as \"Search Name\", splunk_server as Member, search_props.app as App, search_props.user as User, search_props.type as Type, search_props.mode as Mode, search_props.role as Role, mem_used as \"Memory Used (MB)\", pct_cpu as \"CPU Usage (%)\", elapsed as \"Time Elapsed (sec)\"",
        "base": "snapshot_search_concurrency_base",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 10,
        "kind": "html",
        "title": "Summarization Search Details",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Status",
        "query": "fields label role status last_heartbeat ratio unpublished_changes artifact_count\n| eval ratio = if(isnotnull(ratio), ratio, \"N/A\")\n| eval unpublished_changes = if(isnotnull(unpublished_changes), unpublished_changes, \"N/A\")\n| eval artifact_count = if(isnotnull(artifact_count), artifact_count, \"N/A\")\n| `dmc_time_format(last_heartbeat)`\n| `dmc_time_format(last_heartbeat_captain)`\n| eval last_heartbeat = if(isnotnull(last_heartbeat), last_heartbeat, \"N/A\")\n| rename label as Instance, role as Role, status as Status, last_heartbeat as \"Last Heartbeat Sent to Captain\", ratio as \"Configuration Baseline Consistency\", unpublished_changes as \"Number of Unpublished Changes\", artifact_count as \"Artifact Count\"",
        "base": "membersSnapshotSearch",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "count": "10",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Status",
        "query": "",
        "base": "",
        "text": "Click on instance name to see more details.\n        Click on configuration baseline ratio to see more details about configuration replication. Learn More",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "$SHCMemberDrilldown$",
        "query": "where label == \"$SHCMemberDrilldown$\"\n| eval elected_captain = if(isnotnull(elected_captain), elected_captain, \"N/A\")\n| fields - _timediff\n| fields elected_captain guid advertise_restart_required advertise_restart_required_reason delayed_artifacts_to_discard fixup_set pending_job_count replication_count status_counter.Complete status_counter.PendingDiscard peer_scheme_host_port adhoc_searchhead kv_store_host_port replication_port replication_use_ssl site\n| transpose\n| rename column as \"Configuration and Status\", \"row 1\" as Value",
        "base": "membersSnapshotSearch",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "false",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "count": "20",
          "refresh.time.visible": "false"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "$SHCMemberDrilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 11,
        "kind": "table",
        "title": "Configuration Baseline Consistency for: $SHCMemberBaselineDrilldown$",
        "query": "where label == \"$SHCMemberBaselineDrilldown$\"\n            | fields shared_common_baseline no_shared_common_baseline unable_to_connect\n            | rename shared_common_baseline as \"Shares Common Baseline With\", no_shared_common_baseline as \"Does Not Share Common Baseline With\", unable_to_connect as \"No Response From\"",
        "base": "membersSnapshotSearch",
        "text": "",
        "options": {}
      },
      {
        "row": 11,
        "kind": "html",
        "title": "Configuration Baseline Consistency for: $SHCMemberBaselineDrilldown$",
        "query": "",
        "base": "",
        "text": "Close this panel",
        "options": {}
      },
      {
        "row": 13,
        "kind": "chart",
        "title": "Search Concurrency",
        "query": "$shcSearchConHostScope$\n          | stats sum(distinct_search_count) as total_distinct_search_count by provenance, mode, app, type, user, host, _time\n          | `dmc_timechart` partial=false $shcSearchConFunc$(total_distinct_search_count) as search_count by $shcSearchConSplitBy$",
        "base": "shcSearchConBase",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "$searchConVizMode$",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "zero",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 14,
        "kind": "chart",
        "title": "Captain Election Activity",
        "query": "$captainElectionHostScope$\n| `dmc_timechart_for_metrics_log` count(upgrades_to_captain) as captain_election_event",
        "base": "captainElectionBaseSearch",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "bottom",
          "charting.chart.showLabels": "auto"
        }
      },
      {
        "row": 14,
        "kind": "table",
        "title": "Captain Election Details",
        "query": "$captainElectionHostScope$\n| eval event = host.\" was elected as captain.\"\n| fields _time, event\n| sort - _time\n| rename _time as Time, event as Event\n| `dmc_time_format(Time)`",
        "base": "captainElectionBaseSearch",
        "text": "",
        "options": {
          "drilldown": "off"
        }
      },
      {
        "row": 14,
        "kind": "html",
        "title": "Captain Election Details",
        "query": "",
        "base": "",
        "text": "Please use the dropdown menu on the left side panel to select an instance or all instances.",
        "options": {}
      }
    ],
    "sourceSha256": "2f3a8e5b228c7645a743b63cddcfa51c297af44d3a3bf02987705a179745e92b"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "smartstore_activity_deployment",
    "label": "SmartStore Activity: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "search_group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "time",
        "token": "range",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "checkbox",
        "token": "migration",
        "label": "Show Migration Progress",
        "default": "",
        "choices": [
          {
            "value": "Enable",
            "label": ""
          }
        ]
      },
      {
        "type": "checkbox",
        "token": "bootstrap",
        "label": "Show Bootstrap Progress",
        "default": "",
        "choices": [
          {
            "value": "Enable",
            "label": ""
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Remote Storage Connectivity",
        "query": "`dmc_set_index_internal` search_group=$search_group$ source=*splunkd.log CacheManager action=* earliest=-1h \n                | stats count(eval(status=\"failed\")) as txn_failed, count(eval(status=\"succeeded\")) as txn_succeeded \n                | eval available=case(txn_failed=0 AND txn_succeeded=0, \"IDLE\", txn_succeeded>0, \"ONLINE\", true(), \"OFFLINE\") \n                | fields - txn_failed - txn_succeeded",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "IDLE means no remote activity has happened in the last hour.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Migration Progress",
        "query": "| rest splunk_server_group=$search_group$ /services/admin/cacheman\n            | eval stable_size = if('cm:bucket.stable'=1, 'cm:bucket.estimated_size', 0)\n            | stats sum(stable_size) as stable_bytes, sum(cm:bucket.estimated_size) as all_bytes\n            | eval migration_progress=round((stable_bytes / all_bytes) * 100)\n            | fields - stable_bytes - all_bytes",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This tracks progress when migrating data from non-SmartStore to SmartStore. Otherwise ignore this.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Bootstrapping progress",
        "query": "`dmc_set_index_internal` search_group=$search_group$ group=cmmaster source=*metrics.log subgroup=buckets_re_creation\n            | stats sum(success_count) as successes, sum(in_progress_count) as in_progress\n            | eval total = successes + in_progress\n            | eval percent = if(total=0, 100, (1 - ((in_progress - successes) / total)) * 100)\n            | fields percent",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0.00",
          "refresh.display": "progressbar",
          "unit": "%"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This tracks progress when bootstrapping data from remote storage onto indexers. Otherwise, ignore this.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Bucket Activity",
        "query": "`dmc_set_index_internal` search_group=$search_group$ source=*splunkd.log ((action=download AND download_set=*journal*) OR action=upload) status=succeeded component=CacheManager\n            | eval mb = kb / 1024\n            | timechart $funcAggregate$(mb) by action",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$y_label$"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Bucket Activity",
        "query": "",
        "base": "",
        "text": "Each new warm bucket gets uploaded to remote storage. Buckets are only downloaded if they're required for a search and are not already in the local cache. High download rates are a negative indicator of cache health",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Bucket Upload/Download Failure Count",
        "query": "`dmc_set_index_internal` search_group=$search_group$ source=*splunkd.log (action=download OR action=upload) status=failed component=CacheManager\n              | rex field=reason \"HTTP Error (?<statuscode>\\d*): (?<description>.*)\"\n              | eval reason_str = statuscode.\": \".description\n              | fillnull reason_str value=\"Non-HTTP\"\n              | timechart count by $aggregation$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Count",
          "charting.chart": "column",
          "charting.drilldown": "none",
          "height": "323",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Bucket Upload/Download Failure Count",
        "query": "",
        "base": "",
        "text": "Check the logs for details on non-http errors.",
        "options": {}
      }
    ],
    "sourceSha256": "5ac0d63cc8e250e2cd2e655b54bd3cf37c92e4a4d05a28579768c7223c8d6917"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "smartstore_activity_instance",
    "label": "SmartStore Activity: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "time",
        "token": "range",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "checkbox",
        "token": "migration",
        "label": "Show Migration Progress",
        "default": "",
        "choices": [
          {
            "value": "Enable",
            "label": ""
          }
        ]
      },
      {
        "type": "checkbox",
        "token": "bootstrap",
        "label": "Show Bootstrap Progress",
        "default": "",
        "choices": [
          {
            "value": "Enable",
            "label": ""
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Remote Storage Connectivity",
        "query": "`dmc_set_index_internal` host=$host$ source=*splunkd.log CacheManager AND action=* AND earliest=-1h \n                | stats count(eval(status=\"failed\")) as txn_failed, count(eval(status=\"succeeded\")) as txn_succeeded \n                | eval available=case(txn_failed=0 AND txn_succeeded=0, \"IDLE\", txn_succeeded>0, \"ONLINE\", true(), \"OFFLINE\") \n                | fields - txn_failed - txn_succeeded",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "IDLE means no remote activity has happened in the last hour.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Migration Progress",
        "query": "| rest splunk_server=$splunk_server$ /services/admin/cacheman\n            | eval stable_size = if('cm:bucket.stable'=1, 'cm:bucket.estimated_size', 0)\n            | stats sum(stable_size) as stable_bytes, sum(cm:bucket.estimated_size) as all_bytes\n            | eval migration_progress=round((stable_bytes / all_bytes) * 100)\n            | fields - stable_bytes - all_bytes",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This tracks progress when migrating data from non-SmartStore to SmartStore. Otherwise ignore this.",
        "options": {}
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Bootstrapping progress",
        "query": "`dmc_set_index_internal` host=$host$ group=cmmaster source=*metrics.log subgroup=buckets_re_creation\n            | stats sum(success_count) as successes, sum(in_progress_count) as in_progress\n            | eval total = successes + in_progress\n            | eval percent = if(total=0, 100, (1 - ((in_progress - successes) / total)) * 100)\n            | fields percent",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "numberPrecision": "0.00",
          "refresh.display": "progressbar",
          "unit": "%"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This tracks progress when bootstrapping data from remote storage onto indexers. Otherwise, ignore this.",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Bucket Activity",
        "query": "`dmc_set_index_internal` host=$host$ source=*splunkd.log ((action=download AND download_set=*journal*) OR action=upload) status=succeeded component=CacheManager\n            | eval mb = kb / 1024\n            | timechart $funcAggregate$(mb) by action",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "$y_label$"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "Bucket Activity",
        "query": "",
        "base": "",
        "text": "Each new warm bucket gets uploaded to remote storage. Buckets are only downloaded if they're required for a search and are not already in the local cache. High download rates are a negative indicator of cache health",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Bucket Upload/Download Failure Count",
        "query": "`dmc_set_index_internal` host=$splunk_server$ source=*splunkd.log (action=download OR action=upload) status=failed component=CacheManager\n              | rex field=reason \"HTTP Error (?<statuscode>\\d*): (?<description>.*)\"\n              | eval reason_str = statuscode.\": \".description\n              | fillnull reason_str value=\"Non-HTTP\"\n              | timechart count by $aggregation$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Count",
          "charting.chart": "column",
          "charting.drilldown": "none",
          "height": "323",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Bucket Upload/Download Failure Count",
        "query": "",
        "base": "",
        "text": "Check the logs for details on non-http errors.",
        "options": {}
      }
    ],
    "sourceSha256": "b442e6ad8c8a5b8bbb4845aa6521d5a6f559d2c9013e1d2c6a031d99ca4c3c52"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "smartstore_cache_performance_deployment",
    "label": "SmartStore Cache Performance: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "search_group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "time",
        "token": "range",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Minimum Disk Space Conf Setting",
        "query": "| REST splunk_server_group=$search_group$ /services/properties/server/diskUsage/minFreeSpace | eval label = IF(match(value,\"\\%\"), value, tostring(value, \"commas\").\"MB\") | fields label",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "diskUsage.minFreeSpace in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Eviction Padding",
        "query": "| REST splunk_server_group=$search_group$ /services/properties/server/cachemanager/eviction_padding | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "unit": "MB"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.eviction_padding in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Max Cache Size",
        "query": "| REST splunk_server_group=$search_group$ /services/properties/server/cachemanager/max_cache_size | eval size=if(value=0, \"No Max\", tostring(value, \"commas\").\"MB\") | fields size",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.max_cache_size in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Hotlist Recency Seconds",
        "query": "| REST splunk_server_group=$search_group$ /services/properties/server/cachemanager/hotlist_recency_secs | appendpipe [stats count | eval value=86500 | where count=0] | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.hotlist_recency_secs in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Hotlist Bloom Filter Recency Hours",
        "query": "| REST splunk_server_group=$search_group$ /services/properties/server/cachemanager/hotlist_bloom_filter_recency_hours | appendpipe [stats count | eval value=360 | where count=0] | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.hotlist_bloom_filter_recency_hours in server.conf",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "These are server.conf settings that affect SmartStore operations",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Buckets Evicted",
        "query": "`dmc_set_index_internal` search_group=$search_group$ source=*metrics.log | timechart sum(evicted) as Evicted",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Buckets",
          "charting.axisY.abbreviation": "none",
          "charting.chart": "column",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "A steady stream of evictions is expected once the local cache fills up and the oldest data is removed according to the eviction policy.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Remote Storage Search Overhead",
        "query": "`dmc_set_index_internal` search_group=$search_group$  source=*/splunkd_access.log\n              | rex field=uri \"/services/admin/cacheman/bid|(?<bid>[^|]*)|/close\"\n              | search uri=*/close*\n              | eval mytime=strftime(_time, \"%Y-%m-%d %H:%M:%S\")\n              | stats last(_time) as _time count as buckets, sum(miss_ms) as miss_ms sum(search_ms) as search_ms, min(mytime) as issuetime by sid\n              | fillnull value=0 search_ms\n              | eval overheadRatio=(miss_ms/search_ms)\n              | fillnull value=0 overheadRatio\n              | eval searchSpeed=case(overheadRatio > 2,\"More than 50%\", overheadRatio < .2, \"Less than 10%\", true(), \"10%-50%\")\n              | timechart count by searchSpeed",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Searches",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Portion of search time spent downloading buckets from remote storage.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Cache Hits/Misses",
        "query": "`dmc_set_index_internal` search_group=$search_group$ group=cachemgr_bucket source=*metrics.log | timechart sum(cache_hit) as Hits sum(cache_miss) as Misses",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Hit/Miss Ratio",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked100",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "When a search needs a bucket and it's already in cache, that's a hit. If the bucket needs to be downloaded, that's a miss.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Cache Thrash by Index",
        "query": "`dmc_set_index_internal` search_group=$search_group$ source=*splunkd.log CacheManager AND TERM(action=download) AND TERM(status=succeeded) AND download_set=\"*journal*\"\n              | rex field=cache_id \".*\\|(?<customer_index>.*)~.*~.*\\|\"\n              | eval identifier=(cache_id + host)\n              | stats count by identifier, customer_index\n              | stats count(eval(count>1)) as duplicate_downloads, sum(count) as all_downloads count(eval(count>=10)) as excessive_duplicate_downloads by customer_index\n              | eval duplicate_percent=if(all_downloads=0, 0, round((duplicate_downloads/all_downloads)*100, 2))\n              | sort  - duplicate_percent\n              | fields customer_index, duplicate_percent  all_downloads duplicate_downloads excessive_duplicate_downloads \n              | rename customer_index as Index, duplicate_percent as \"Repeat Download Percent\",  all_downloads as \"All Downloads\", duplicate_downloads as \"Repeated Downloads\", excessive_duplicate_downloads as \"Excessively Repeated Downloads\"",
        "base": "",
        "text": "",
        "options": {
          "count": "10",
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This is the percentage of bucket downloads that are repeats. This happens when a bucket is downloaded for a search, evicted based on policy, and then needed by a search again. \"Excessively Repeated Downloads\" are buckets that have been downloaded more than 10 times.",
        "options": {}
      }
    ],
    "sourceSha256": "b7eb78d305bee0f7e159c78e2cf4f06dd87d6bc1881d03d92e3370a8c496001d"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "smartstore_cache_performance_instance",
    "label": "SmartStore Cache Performance: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "time",
        "token": "range",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Minimum Free Space",
        "query": "| REST splunk_server=$splunk_server$ /services/properties/server/diskUsage/minFreeSpace | eval label = IF(match(value,\"\\%\"), value, tostring(value, \"commas\").\"MB\") | fields label",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "diskUsage.minFreeSpace in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Eviction Padding",
        "query": "| REST splunk_server=$splunk_server$ /services/properties/server/cachemanager/eviction_padding | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "unit": "MB"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.eviction_padding in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Max Cache Size",
        "query": "| REST splunk_server=$splunk_server$ /services/properties/server/cachemanager/max_cache_size | eval size=if(value=0, \"No Max\", tostring(value, \"commas\").\"MB\") | fields size",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.max_cache_size in server.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Hotlist Recency Seconds",
        "query": "| REST splunk_server=$splunk_server$ /services/properties/server/cachemanager/hotlist_recency_secs | appendpipe [stats count | eval value=86500 | where count=0] | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.hotlist_recency_secs in indexes.conf",
        "options": {}
      },
      {
        "row": 0,
        "kind": "single",
        "title": "Hotlist Bloom Filter Recency Hours",
        "query": "| REST splunk_server=$splunk_server$ /services/properties/server/cachemanager/hotlist_bloom_filter_recency_hours | appendpipe [stats count | eval value=360 | where count=0] | fields value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "cachemanager.hotlist_bloom_filter_recency_hours in indexes.conf",
        "options": {}
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "These are server.conf settings that affect SmartStore operations",
        "options": {}
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Buckets Evicted",
        "query": "`dmc_set_index_internal` host=$splunk_server$ source=*metrics.log | timechart sum(evicted) as Evicted",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Buckets",
          "charting.axisY.abbreviation": "none",
          "charting.chart": "column",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 2,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "A steady stream of evictions is expected once the local cache fills up and the oldest data is removed according to the eviction policy.",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Remote Storage Search Overhead",
        "query": "`dmc_set_index_internal` host=$splunk_server$  source=*/splunkd_access.log\n              | rex field=uri \"/services/admin/cacheman/bid|(?<bid>[^|]*)|/close\"\n              | search uri=*/close*\n              | eval mytime=strftime(_time, \"%Y-%m-%d %H:%M:%S\")\n              | stats last(_time) as _time count as buckets, sum(miss_ms) as miss_ms sum(search_ms) as search_ms, min(mytime) as issuetime by sid\n              | fillnull value=0 search_ms\n              | eval overheadRatio=(miss_ms/search_ms)\n              | fillnull value=0 overheadRatio\n              | eval searchSpeed=case(overheadRatio > 2,\"More than 50%\", overheadRatio < .2, \"Less than 10%\", true(), \"10%-50%\")\n              | timechart count by searchSpeed",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Searches",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Portion of search time spent downloading buckets from remote storage.",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Cache Hits/Misses",
        "query": "`dmc_set_index_internal` host=$splunk_server$ source=*metrics.log group=cachemgr_bucket | timechart sum(cache_hit) as Hits sum(cache_miss) as Misses",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleY.text": "Hit/Miss Ratio",
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked100",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "When a search needs a bucket and it's already in cache, that's a hit. If the bucket needs to be downloaded, that's a miss.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Cache Thrash by Index",
        "query": "`dmc_set_index_internal` host=$splunk_server$  source=*splunkd.log CacheManager AND TERM(action=download) AND TERM(status=succeeded) AND download_set=\"*journal*\"\n              | rex field=cache_id \".*\\|(?<customer_index>.*)~.*~.*\\|\"\n              | eval identifier=(cache_id + host)\n              | stats count by identifier, customer_index\n              | stats count(eval(count>1)) as duplicate_downloads, sum(count) as all_downloads count(eval(count>=10)) as excessive_duplicate_downloads by customer_index\n              | eval duplicate_percent=if(all_downloads=0, 0, round((duplicate_downloads/all_downloads)*100, 2))\n              | sort  - duplicate_percent\n              | fields customer_index, duplicate_percent  all_downloads duplicate_downloads excessive_duplicate_downloads \n              | rename customer_index as Index, duplicate_percent as \"Repeated Download Percent\",  all_downloads as \"All Downloads\", duplicate_downloads as \"Repeated Downloads\", excessive_duplicate_downloads as \"Excessively Repeated Downloads\"",
        "base": "",
        "text": "",
        "options": {
          "count": "10",
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "This is the percentage of bucket downloads that are repeats. This happens when a bucket is downloaded for a search, evicted based on policy, and then needed by a search again. \"Excessively Repeated Downloads\" are buckets that have been downloaded more than 10 times.",
        "options": {}
      }
    ],
    "sourceSha256": "c003b62b139a05c0f386373d760827922f009a381c0e6df3efa1fed5c557d756"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "splunk_tcpin_performance_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "splunk_tcpin_performance_deployment",
    "label": "Splunk TCP Input Performance: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "rex field=queue_fill_last_10min \"pset\\d+:\\s(?<queue_fill_last_10min>\\d+\\.\\d+)\"\n              | stats max(queue_fill_last_10min) as queue_fill_last_10min by splunk_server\n              | where queue_fill_last_10min > 60\n              | stats count as degraded_instance_count_queue_fill_ratio",
        "base": "tcp_queue_fill_ratio_snapshot",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "degraded_instance_count_queue_fill_ratio",
          "splunk_monitoring_console.KpiTrafficLight.detail": "splunk_server",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"Queue fill ratio within the last 10 minutes is healthy for all instances.\", \"Queue fill ratio within the last 10 minutes is degraded on $degraded_instance_count_queue_fill_ratio$ instance(s).\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer search_group=\"$group$\" sourcetype=splunkd source=*splunkd.log \"WARN\" TcpInputConfig \"reverse dns lookups appear to be excessively slow, this may impact receiving from network inputs.\"\n            | stats count as degraded_instance_count_dnc_lookup, values(host) as hosts",
        "base": "",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "degraded_instance_count_dnc_lookup",
          "splunk_monitoring_console.KpiTrafficLight.detail": "hosts",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"There were no reverse DNS lookup warnings within the last hour.\", \"There were $degraded_instance_count_dnc_lookup$ reverse DNS lookup warning(s) within the last hour.\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "`dmc_set_index_internal` search_group=dmc_group_indexer search_group=\"$group$\" sourcetype=splunkd source=*splunkd.log log_level=\"WARN\" component=TcpInputProc \"Stopping all listening ports.\"\n            | stats count as degraded_instance_count_port_closure, values(host) as hosts",
        "base": "",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "degraded_instance_count_port_closure",
          "splunk_monitoring_console.KpiTrafficLight.detail": "hosts",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"There were no Splunk TCP port closures due to queue blockages within the last hour.\", \"There were $degraded_instance_count_port_closure$ Splunk TCP port closure(s) due to queue blockages within the last hour.\"]"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Current Splunk TCP Input Queue Fill Ratio",
        "query": "stats count as pset_count, values(ports), as ports values(queue_fill_last_1min) as queue_fill_last_1min, values(queue_fill_last_10min) as queue_fill_last_10min by splunk_server\n            | fields splunk_server, pset_count, ports, queue_fill_last_1min, queue_fill_last_10min\n            | rename splunk_server as \"Instance\", pset_count as \"Pipeline Set Count\", ports as \"Ports\", queue_fill_last_1min as \"Queue Fill Ratio (Last 1 Minute)\", queue_fill_last_10min as \"Queue Fill Ratio (Last 10 Minutes)\"",
        "base": "tcp_queue_fill_ratio_snapshot",
        "text": "",
        "options": {
          "drilldown": "row"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Average Splunk TCP Incoming Throughput by Indexer",
        "query": "`dmc_tcp_throughput_split_by(host, \"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Average KB/s",
          "charting.axisLabelsX.axisVisibility": "hide"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Average Splunk TCP Incoming Throughput by Forwarder Type",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | `dmc_rename_forwarder_type(fwdType)`\n            | `dmc_timechart_for_metrics_log` per_second(kb) as avg_tcp_KBps by fwdType\n            | rename avg_tcp_KBps as \"KB/s\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Average KB/s",
          "charting.axisLabelsX.axisVisibility": "hide"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Average Splunk TCP Incoming Throughput by Port",
        "query": "`dmc_tcp_throughput_split_by(destPort, \"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Average KB/s",
          "charting.axisLabelsX.axisVisibility": "hide"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Total Average Splunk TCP Incoming Throughput and Forwarder Count",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | `dmc_timechart_for_metrics_log` dc(guid) as forwarder_count, per_second(kb) as tcp_KBps\n            | rename forwarder_count as \"Forwarder Count\", tcp_KBps as \"Throughput (KB/s)\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.legend.placement": "bottom",
          "charting.chart.overlayFields": "\"Throughput (KB/s)\"",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "Average KB/s",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Connection Count by Indexer",
        "query": "`dmc_tcp_forwarder_count_split_by(host, \"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Forwarder Count by Forwarder Type",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | `dmc_rename_forwarder_type(fwdType)`\n            | `dmc_timechart_for_metrics_log` dc(guid) as forwarder_count by fwdType\n            | rename forwarder_count as \"Forwarder Count\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Forwarder Count by Port",
        "query": "`dmc_tcp_forwarder_count_split_by(destPort, \"$group$\")`",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 7,
        "kind": "table",
        "title": "$drilldown_global_forwarder_count$ forwarders connected to selected indexer group between $drilldown_global_forwarder_earliest_label$ ~ $drilldown_global_forwarder_latest_label$",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | stats dc(host) as connection_count by guid\n            | join type=outer guid [| inputlookup dmc_forwarder_assets]\n            | `dmc_rename_forwarder_type(forwarder_type)`\n            | makemv delim=\" \" avg_tcp_kbps_sparkline\n            | eval sum_kb = if (status == \"missing\", \"N/A\", sum_kb)\n            | eval avg_tcp_kbps_sparkline = if (status == \"missing\", \"N/A\", avg_tcp_kbps_sparkline)\n            | eval avg_tcp_kbps = if (status == \"missing\", \"N/A\", avg_tcp_kbps)\n            | eval avg_tcp_eps = if (status == \"missing\", \"N/A\", avg_tcp_eps)\n            | `dmc_rename_forwarder_type(fwdType)`\n            | `dmc_time_format(last_connected)`\n            | fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps, connection_count\n            | search hostname=\"***\"\n            | search status=\"*\"\n            | rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\", connection_count as \"Number of Connections\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "$drilldown_indexer_forwarder_count$ forwarders connected to $drilldown_indexer_name$ between $drilldown_indexer_forwarder_earliest_label$ ~ $drilldown_indexer_forwarder_latest_label$",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | where host=\"$drilldown_indexer_name$\"\n            | stats dc(host) as connection_count by guid\n            | join type=outer guid [| inputlookup dmc_forwarder_assets]\n            | `dmc_rename_forwarder_type(forwarder_type)`\n            | makemv delim=\" \" avg_tcp_kbps_sparkline\n            | eval sum_kb = if (status == \"missing\", \"N/A\", sum_kb)\n            | eval avg_tcp_kbps_sparkline = if (status == \"missing\", \"N/A\", avg_tcp_kbps_sparkline)\n            | eval avg_tcp_kbps = if (status == \"missing\", \"N/A\", avg_tcp_kbps) | eval avg_tcp_eps = if (status == \"missing\", \"N/A\", avg_tcp_eps)\n            | `dmc_rename_forwarder_type(fwdType)`\n            | `dmc_time_format(last_connected)`\n            | fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps\n            | search hostname=\"***\"\n            | search status=\"*\"\n            | rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "$drilldown_type_forwarder_count$ $drilldown_type_forwarder_type$ forwarders connected to selected indexer group between $drilldown_type_forwarder_earliest_label$ ~ $drilldown_type_forwarder_latest_label$ ",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | `dmc_rename_forwarder_type(fwdType)`\n            | where fwdType=\"$drilldown_type_forwarder_type$\"\n            | stats dc(host) as connection_count by guid\n            | join type=outer guid [| inputlookup dmc_forwarder_assets]\n            | `dmc_rename_forwarder_type(forwarder_type)`\n            | makemv delim=\" \" avg_tcp_kbps_sparkline\n            | eval sum_kb = if (status == \"missing\", \"N/A\", sum_kb)\n            | eval avg_tcp_kbps_sparkline = if (status == \"missing\", \"N/A\", avg_tcp_kbps_sparkline)\n            | eval avg_tcp_kbps = if (status == \"missing\", \"N/A\", avg_tcp_kbps)\n            | eval avg_tcp_eps = if (status == \"missing\", \"N/A\", avg_tcp_eps)\n            | `dmc_time_format(last_connected)`\n            | fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps, connection_count\n            | search hostname=\"***\"\n            | search status=\"*\"\n            | rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\", connection_count as \"Number of Connections\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 7,
        "kind": "table",
        "title": "$drilldown_port_forwarder_count$ forwarders on port $drilldown_port_forwarder_port$ connected to selected indexer group between $drilldown_port_forwarder_earliest_label$ ~ $drilldown_port_forwarder_latest_label$ ",
        "query": "`dmc_get_forwarder_tcpin` search_group=dmc_group_indexer search_group=\"$group$\"\n            | where destPort=\"$drilldown_port_forwarder_port$\"\n            | stats dc(host) as connection_count by guid\n            | join type=outer guid [| inputlookup dmc_forwarder_assets]\n            | `dmc_rename_forwarder_type(forwarder_type)`\n            | makemv delim=\" \" avg_tcp_kbps_sparkline\n            | eval sum_kb = if (status == \"missing\", \"N/A\", sum_kb)\n            | eval avg_tcp_kbps_sparkline = if (status == \"missing\", \"N/A\", avg_tcp_kbps_sparkline)\n            | eval avg_tcp_kbps = if (status == \"missing\", \"N/A\", avg_tcp_kbps) | eval avg_tcp_eps = if (status == \"missing\", \"N/A\", avg_tcp_eps)\n            | `dmc_rename_forwarder_type(fwdType)`\n            | `dmc_time_format(last_connected)`\n            | fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps, connection_count\n            | search hostname=\"***\"\n            | search status=\"*\"\n            | rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\", connection_count as \"Number of Connections\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 7,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Indexer Count by $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 9,
        "kind": "viz",
        "title": "Indexer Count by $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=splunktcpin\n            | eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n            | eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n            | eval fill_perc=round((curr/max)*100,2)\n            | bin _time minspan=30s\n            | stats $fillRatioAggrFunc$(fill_perc) AS \"fill_percentage\" by host, _time\n            | `dmc_queue_fill_ratio_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Indexer Count by $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=splunktcpin\n            | eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n            | eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n            | eval fill_perc=round((curr/max)*100,2)\n            | bin _time minspan=30s\n            | stats $fillRatioAggrFunc$(fill_perc) AS \"fill_percentage\" by host, _time\n            | `dmc_queue_fill_ratio_rangemap_and_timechart`",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance count",
          "charting.fieldColors": "{\"80-100%\": 0xD85D3C, \"60-80%\": 0xF7902B, \"0-60%\":0x9AC23C, \"abnormal\":0xC4C4C0}"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Indexer Count by $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "`dmc_drilldown_indexing_performance_deployment_queue_fill_ratio(\"*\", splunktcpin, $fillRatioAggrFunc$, $drilldown_queue_fill_ratio_metric$)`",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 9,
        "kind": "html",
        "title": "Indexer Count by $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      },
      {
        "row": 9,
        "kind": "chart",
        "title": "Splunk $fillRatioAggrLabel$ TCP Input Queue Fill Ratio By Instance",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=splunktcpin\n            | eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n            | eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n            | eval fill_perc=round((curr/max)*100,2)\n            | `dmc_timechart_for_metrics_log` partial=f limit=25 $fillRatioAggrFunc$(fill_perc) AS fill_percentage by host",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "bottom",
          "charting.axisY.maximumNumber": "100",
          "charting.axisLabelsY.majorUnit": "25",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Queue % filled"
        }
      },
      {
        "row": 10,
        "kind": "chart",
        "title": "Deployment-Wide $fillRatioAggrLabel$ Splunk TCP Input Queue Fill Ratio",
        "query": "`dmc_set_index_internal` sourcetype=splunkd source=*metrics.log search_group=dmc_group_indexer search_group=\"$group$\" group=queue name=splunktcpin\n            | eval max=if(isnotnull(max_size_kb),max_size_kb,max_size)\n            | eval curr=if(isnotnull(current_size_kb),current_size_kb,current_size)\n            | eval fill_perc=round((curr/max)*100,2)\n            | `dmc_timechart_for_metrics_log` partial=f $fillRatioAggrFunc$(fill_perc) AS fill_percentage",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "line",
          "charting.chart.nullValueMode": "connect",
          "charting.legend.placement": "none",
          "charting.axisY.maximumNumber": "100",
          "charting.axisLabelsY.majorUnit": "25",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Queue % filled"
        }
      },
      {
        "row": 11,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Count of instances grouped by the $fillRatioAggrLabel$ fill ratio of the Splunk TCP queue over time.",
        "options": {}
      },
      {
        "row": 11,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "$fillRatioAggrLabel$ fill ratio of the Splunk TCP queue over time by instance.",
        "options": {}
      }
    ],
    "sourceSha256": "e1913add0531bdc0ffd5effd230b36bcc4f02fe1b6b98206f7499739f13886d1"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "splunk_tcpin_performance_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "f327d207f839f0e24987b8bfc8c33d4b9cbd671db3405fa36c002e6f0cc27d40"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "splunk_tcpin_performance_instance",
    "label": "Splunk TCP Input Performance: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance:",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "rex field=queue_fill_last_10min \"pset\\d+:\\s(?<queue_fill_last_10min>\\d+\\.\\d+)\"\n              | stats max(queue_fill_last_10min) as queue_fill_last_10min\n              | where queue_fill_last_10min > 60\n              | stats count as degraded_instance_count_queue_fill_ratio",
        "base": "queue_fill_ratio_base",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "degraded_instance_count_queue_fill_ratio",
          "splunk_monitoring_console.KpiTrafficLight.detail": "splunk_server",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"Queue fill ratio within the last 10 minutes is healthy for this instance.\", \"Queue fill ratio within the last 10 minutes is degraded for this instance.\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "`dmc_set_index_internal` splunk_server=$splunk_server$ sourcetype=splunkd source=*splunkd.log \"WARN\" TcpInputConfig \"reverse dns lookups appear to be excessively slow, this may impact receiving from network inputs.\"\n            | stats count as dns_lookup_warning_count",
        "base": "",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "dns_lookup_warning_count",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"There were no reverse DNS lookup warnings within the last hour for this instance.\", \"There was at least one reverse DNS lookup warning within the last hour for this instance.\"]"
        }
      },
      {
        "row": 0,
        "kind": "viz",
        "title": "Health Check",
        "query": "`dmc_set_index_internal` splunk_server=$splunk_server$ sourcetype=splunkd source=*splunkd.log log_level=\"WARN\" component=TcpInputProc \"Stopping all listening ports.\"\n            | stats count as port_closure_count",
        "base": "",
        "text": "",
        "options": {
          "height": "45",
          "splunk_monitoring_console.KpiTrafficLight.field": "port_closure_count",
          "splunk_monitoring_console.KpiTrafficLight.rangeValues": "[0]",
          "splunk_monitoring_console.KpiTrafficLight.rangeIcons": "[\"success\", \"error\"]",
          "splunk_monitoring_console.KpiTrafficLight.rangeLabels": "[\"There were no Splunk TCP port closures due to queue blockages within the last hour for this instance.\", \"There were Splunk TCP port closures due to queue blockages within the last hour for this instance.\"]"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Current Splunk TCP Input Queue Fill Ratio",
        "query": "stats count as pset_count, values(ports), as ports values(queue_fill_last_1min) as queue_fill_last_1min, values(queue_fill_last_10min) as queue_fill_last_10min by splunk_server\n            | fields splunk_server, pset_count, ports, queue_fill_last_1min, queue_fill_last_10min\n            | rename splunk_server as \"Instance\", pset_count as \"Pipeline Set Count\", ports as \"Ports\", queue_fill_last_1min as \"Queue Fill Ratio (Last 1 Minute)\", queue_fill_last_10min as \"Queue Fill Ratio (Last 10 Minutes)\"",
        "base": "queue_fill_ratio_base",
        "text": "",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Average Splunk TCP Incoming Throughput and Forwarder Count",
        "query": "`dmc_get_forwarder_tcpin` host=$host$\n            | `dmc_timechart_for_metrics_log` dc(guid) as forwarder_count, avg(tcp_KBps) as avg_tcp_KBps\n            | rename forwarder_count as \"Forwarder Count\", avg_tcp_KBps as \"Throughput (KB/s)\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisY2.enabled": "true",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.legend.placement": "bottom",
          "charting.chart.overlayFields": "\"Throughput (KB/s)\"",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.axisLabelsY2.majorUnit": "1",
          "charting.axisTitleY.text": "Count",
          "charting.axisTitleY2.text": "Average KB/s",
          "charting.axisTitleX.text": "Time"
        }
      },
      {
        "row": 6,
        "kind": "table",
        "title": "$drilldown_forwarder_count$ forwarders connected to selected indexer group between $drilldown_forwarder_earliest_label$ ~ $drilldown_forwarder_latest_label$",
        "query": "`dmc_get_forwarder_tcpin` host=$host$\n            | stats dc(host) as connection_count by guid\n            | join type=outer guid [| inputlookup dmc_forwarder_assets]\n            | `dmc_rename_forwarder_type(forwarder_type)`\n            | makemv delim=\" \" avg_tcp_kbps_sparkline \n            | eval sum_kb = if (status == \"missing\", \"N/A\", sum_kb) \n            | eval avg_tcp_kbps_sparkline = if (status == \"missing\", \"N/A\", avg_tcp_kbps_sparkline) \n            | eval avg_tcp_kbps = if (status == \"missing\", \"N/A\", avg_tcp_kbps) \n            | eval avg_tcp_eps = if (status == \"missing\", \"N/A\", avg_tcp_eps) \n            | `dmc_rename_forwarder_type(fwdType)` \n            | `dmc_time_format(last_connected)` \n            | fields hostname, forwarder_type, version, os, arch, status, last_connected, sum_kb, avg_tcp_kbps_sparkline, avg_tcp_kbps, avg_tcp_eps, connection_count \n            | search hostname=\"***\" \n            | search status=\"*\" \n            | rename hostname as Instance, forwarder_type as Type, version as Version, os as OS, arch as Architecture, status as Status, last_connected as \"Last Connected to Indexers\", sum_kb as \"Total KB\", avg_tcp_kbps_sparkline as \"Average KB/s Over Time\", avg_tcp_kbps as \"Average KB/s\", avg_tcp_eps as \"Average Events/s\", connection_count as \"Number of Connections\"",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Close this drilldown table",
        "options": {}
      }
    ],
    "sourceSha256": "fc88dcb04e4fe8233de6008efdf39e8bfbdb7c07f8a39e8fbbcc504a80d42d63"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "standalone.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "standalone",
    "label": "Not available in standalone mode",
    "description": "The page you have requested is not available in standalone mode.",
    "kind": "form",
    "inputs": [],
    "panels": [],
    "sourceSha256": "60004583d98d00104d3f3ee8d677fc52bc7433c2280d0168b95c98edce02b333"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "volume_detail_deployment.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "volume_detail_deployment",
    "label": "Volume Detail: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "group",
        "label": "Group",
        "default": "*",
        "choices": [
          {
            "value": "*",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "volume",
        "label": "Volume",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views:\n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Volume Structure Overview",
        "query": "stats dc(splunk_server) as Indexers",
        "base": "volumes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Indexers"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Volume Structure Overview",
        "query": "stats sum(volumeSizeGB) as totalVolumeSizeGB\n            | eval totalVolumeSizeGB = round(totalVolumeSizeGB, 2).\" GB\"",
        "base": "volumes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Total Volume Size"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Volume Structure Overview",
        "query": "stats avg(volumeSizeGB) as avgVolumeSizeGB\n            | eval avgVolumeSizeGB = round(avgVolumeSizeGB, 2).\" GB\"",
        "base": "volumes_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Average Volume Size Per Indexer"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Instances ($instanceCount$)",
        "query": "fields splunk_server, diskUsageGB, maxSizeGB, volume_path\n            | rename splunk_server as \"Instance\", diskUsageGB as \"Volume Usage (GB)\", maxSizeGB as \"Volume Capacity (GB)\", volume_path as \"Volume Path\"",
        "base": "volumes_base_search",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "html",
        "title": "Instances ($instanceCount$)",
        "query": "",
        "base": "",
        "text": "Volume Usage:\n          The first value is the current size of the volume. The second value is the volume capacity, as specified by the maxVolumeDataSizeMB attribute in\n          indexes.conf.\n        \n        \n          Note:\n          if the volume is \"unlimited\", it is not possible to determine the disk usage for the volume.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$VolumeUsageChartTitle$ Volume Size (GB)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Volumes data.name=$volume$ search_group=dmc_group_indexer search_group=\"$group$\"\n            | `dmc_set_bin_for_disk_usage`\n            | stats latest(data.total_size) as totalSize by host _time\n            | `dmc_timechart_for_disk_usage` $funcDiskSizeUsage$(eval(totalSize /1024)) as \"Volume Size\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "GB",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Instances by $PercentVolumeUsageChartTitle$ Volume Usage (%)",
        "query": "",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "viz",
        "title": "Instances by $PercentVolumeUsageChartTitle$ Volume Usage (%)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Volumes data.name=$volume$ search_group=dmc_group_indexer search_group=\"$group$\"\n            | eval pctDiskUsage = 'data.total_size' / 'data.max_size'\n            | bin _time minspan=10min\n            | stats $funcDiskPercUsage$(pctDiskUsage) as pctDiskUsage by host _time\n            | rangemap field=pctDiskUsage \"0-25%\"=0-0.25 \"25-50%\"=0.2501-0.5 \"50-75%\"=0.5001-0.75 \"75-100%\"=0.7501-1 default=abnormal\n            | `dmc_timechart_for_disk_usage` partial=f dc(host) as host by range\n            | fields _time, \"0-25%\", \"25-50%\", \"50-75%\", \"75-100%\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Instances by $PercentVolumeUsageChartTitle$ Volume Usage (%)",
        "query": "index=_introspection sourcetype=splunk_disk_objects component=Volumes data.name=$volume$ search_group=dmc_group_indexer search_group=\"$group$\"\n            | eval pctDiskUsage = 'data.total_size' / 'data.max_size'\n            | bin _time minspan=10min\n            | stats $funcDiskPercUsage$(pctDiskUsage) as pctDiskUsage by host _time\n            | rangemap field=pctDiskUsage \"0-25%\"=0-0.25 \"25-50%\"=0.2501-0.5 \"50-75%\"=0.5001-0.75 \"75-100%\"=0.7501-1 default=abnormal\n            | `dmc_timechart_for_disk_usage` partial=f dc(host) as host by range\n            | fields _time, \"0-25%\", \"25-50%\", \"50-75%\", \"75-100%\"",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Instance Count",
          "charting.axisLabelsY.majorUnit": "1"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Instances by $PercentVolumeUsageChartTitle$ Volume Usage (%)",
        "query": "",
        "base": "",
        "text": "* Note: An indexer on which the maximum data size of the volume is infinite will not be represented here.",
        "options": {}
      }
    ],
    "sourceSha256": "470a3412f0801f91fc8248817af0119191e9ebc5d053eb74835c19dbd1b8f307"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "volume_detail_instance.prod_lite",
    "label": "Error",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "20be046579846edf9162d4ac081cc995919d72195076e724516521f3b2eefe30"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "volume_detail_instance",
    "label": "Volume Detail: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "datatype",
        "label": "Index Type",
        "default": "",
        "choices": [
          {
            "value": "",
            "label": "Event Indexes Only"
          },
          {
            "value": "datatype=all",
            "label": "All Index Types *"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "dmc_group_indexer",
        "choices": [
          {
            "value": "dmc_group_indexer",
            "label": "All Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "volume_name",
        "label": "Volume",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "fields title, home_vol_name, cold_vol_name\n            | where home_vol_name == \"$volume_name$\" OR cold_vol_name == \"$volume_name$\"\n            | stats dc(title) as count",
        "base": "index_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Indexes using Volume \"$volume_name$\""
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Overview",
        "query": "fields title, bucket_dirs.home.hot_bucket_count, bucket_dirs.home.warm_bucket_count, bucket_dirs.cold.bucket_count, home_vol_name, cold_vol_name\n            | where home_vol_name == \"$volume_name$\" OR cold_vol_name == \"$volume_name$\"\n            | eval bucket_dirs.home.hot_bucket_count = if(isnotnull('bucket_dirs.home.hot_bucket_count'), 'bucket_dirs.home.hot_bucket_count', 0)\n            | eval bucket_dirs.home.warm_bucket_count = if(isnotnull('bucket_dirs.home.warm_bucket_count'), 'bucket_dirs.home.warm_bucket_count', 0)\n            | eval bucket_dirs.cold.bucket_count = if(isnotnull('bucket_dirs.cold.bucket_count'), 'bucket_dirs.cold.bucket_count', 0)\n            | eval bucket_count = case(\n                home_vol_name == cold_vol_name, 'bucket_dirs.home.hot_bucket_count' + 'bucket_dirs.home.warm_bucket_count' + 'bucket_dirs.cold.bucket_count',\n                home_vol_name == \"$volume_name$\", 'bucket_dirs.home.hot_bucket_count' + 'bucket_dirs.home.warm_bucket_count',\n                cold_vol_name == \"$volume_name$\", 'bucket_dirs.cold.bucket_count')\n            | stats sum(bucket_count) as bucket_count\n            | eval bucket_count = toString(bucket_count, \"commas\")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Buckets"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "fields title, bucket_dirs.home.event_count, bucket_dirs.cold.event_count, home_vol_name, cold_vol_name\n            | where home_vol_name == \"$volume_name$\" OR cold_vol_name == \"$volume_name$\"\n            | eval bucket_dirs.home.event_count = if(isnotnull('bucket_dirs.home.event_count'), 'bucket_dirs.home.event_count', 0)\n            | eval bucket_dirs.cold.event_count = if(isnotnull('bucket_dirs.cold.event_count'), 'bucket_dirs.cold.event_count', 0)\n            | eval event_count = case(\n            home_vol_name == cold_vol_name, 'bucket_dirs.home.event_count' + 'bucket_dirs.cold.event_count',\n            home_vol_name == \"$volume_name$\", 'bucket_dirs.home.event_count',\n            cold_vol_name == \"$volume_name$\", 'bucket_dirs.cold.event_count')\n            | stats sum(event_count) as count\n            | eval count = toString(count, \"commas\")",
        "base": "index_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Event Count"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "fields title, bucket_dirs.home.event_min_time, bucket_dirs.cold.event_min_time, home_vol_name, cold_vol_name\n            | where home_vol_name == \"$volume_name$\" OR cold_vol_name == \"$volume_name$\"\n            | eval min_time = case(\n            home_vol_name == cold_vol_name, min('bucket_dirs.home.event_min_time', 'bucket_dirs.cold.event_min_time'),\n            home_vol_name == \"$volume_name$\", 'bucket_dirs.home.event_min_time',\n            cold_vol_name == \"$volume_name$\", 'bucket_dirs.cold.event_min_time')\n            | stats min(min_time) as min_time\n            | `dmc_time_format(min_time)`",
        "base": "index_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Earliest Event"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Events",
        "query": "fields title, bucket_dirs.home.event_max_time, bucket_dirs.cold.event_max_time, home_vol_name, cold_vol_name\n            | where home_vol_name == \"$volume_name$\" OR cold_vol_name == \"$volume_name$\"\n            | eval max_time = case(\n            home_vol_name == cold_vol_name, max('bucket_dirs.home.event_max_time', 'bucket_dirs.cold.event_max_time'),\n            home_vol_name == \"$volume_name$\", 'bucket_dirs.home.event_max_time',\n            cold_vol_name == \"$volume_name$\", 'bucket_dirs.cold.event_max_time')\n            | stats max(max_time) as max_time\n            | `dmc_time_format(max_time)`",
        "base": "index_base_search",
        "text": "",
        "options": {
          "height": "80px",
          "underLabel": "Latest Event"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Volume Usage",
        "query": "where title == \"$volume_name$\"\n            | eval total_size_gb = if(isnull(total_size), \"-\", round(total_size / 1024, 2))\n            | eval max_size_gb = if(isnull(max_size) OR max_size = \"infinite\", \"unlimited\", round(max_size / 1024, 2))\n            | eval disk_usage_gb = total_size_gb.\" / \".max_size_gb\n            | fields title, disk_usage_gb, max_size_gb, volume_path\n            | rename title as Volume, disk_usage_gb as \"Volume Usage (GB)\", max_size_gb as \"Volume Capacity (GB)\", volume_path as \"Volume Path\"",
        "base": "volume_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 4,
        "kind": "html",
        "title": "Volume Usage",
        "query": "",
        "base": "",
        "text": "Volume Usage: The first value is the current size of the volume. The second value is the volume capacity, as specified by the maxVolumeDataSizeMB attribute in indexes.conf.\n        Note: if the volume is \"unlimited\", it is not possible to determine the disk usage for the volume.",
        "options": {}
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Index Directories Using This Volume",
        "query": "eval cold_bucket_size = if(isnotnull('bucket_dirs.cold.bucket_size'), 'bucket_dirs.cold.bucket_size', 'bucket_dirs.cold.size')\n            | fields title, bucket_dirs.home.event_min_time, bucket_dirs.cold.event_min_time, cold_bucket_size, total_size, home_vol_name, cold_vol_name\n            | rename cold_bucket_size AS cold_size\n            | eval cold_size = if(isnull(cold_size), 0, cold_size)\n            | eval home_size = total_size - cold_size\n            | eval cold_size = round(cold_size / 1024, 2)\n            | eval home_size = round(home_size / 1024, 2)\n            | eval dir = \"home,cold\"\n            | makemv dir delim=\",\"\n            | mvexpand dir\n            | eval dir_size = case(dir == \"home\", home_size, dir == \"cold\", cold_size)\n            | eval vol_name = case(dir == \"home\", home_vol_name, dir == \"cold\", cold_vol_name)\n            | eval data_age_home_day = if(dir == \"home\", round((now() - 'bucket_dirs.home.event_min_time') / 86400, 0), NULL)\n            | eval data_age_cold_day = if(dir == \"cold\", round((now() - 'bucket_dirs.cold.event_min_time') / 86400, 0), NULL)\n            | eval data_age_day = case(dir == \"home\", data_age_home_day, dir == \"cold\", data_age_cold_day)\n            | eval data_age_day = if(isnull(data_age_day), \"n/a\", data_age_day)\n            | where vol_name == \"$volume_name$\"\n            | fields title dir dir_size data_age_day vol_name\n            | where isnotnull(vol_name)\n            | eval index_dir_name = title.\":\".dir\n            | fields index_dir_name dir_size data_age_day\n            | sort - dir_size\n            | rename index_dir_name as \"Index:Directory\" dir_size AS \"Disk Usage (GB)\" data_age_day as \"Data Age (Days)\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "Volume Usage By Index Directory",
        "query": "eval cold_bucket_size = if(isnotnull('bucket_dirs.cold.bucket_size'), 'bucket_dirs.cold.bucket_size', 'bucket_dirs.cold.size')\n            | fields title, cold_bucket_size, total_size, home_vol_name, cold_vol_name\n            | rename cold_bucket_size AS cold_size\n            | eval cold_size = if(isnull(cold_size), 0, cold_size)\n            | eval home_size = total_size - cold_size\n            | eval cold_size = round(cold_size / 1024, 2)\n            | eval home_size = round(home_size / 1024, 2)\n            | eval dir = \"home,cold\"\n            | makemv dir delim=\",\"\n            | mvexpand dir\n            | eval dir_size = case(dir == \"home\", home_size, dir == \"cold\", cold_size)\n            | eval vol_name = case(dir == \"home\", home_vol_name, dir == \"cold\", cold_vol_name)\n            | where vol_name == \"$volume_name$\"\n            | fields title dir dir_size vol_name\n            | where isnotnull(vol_name) AND isnotnull(dir_size) AND dir_size > 0\n            | eval index_dir_name = title.\":\".dir\n            | where vol_name == \"$volume_name$\"\n            | stats sum(dir_size) AS dir_size by index_dir_name",
        "base": "index_base_search",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.axisTitleY.text": "Volume Usage (GB)"
        }
      },
      {
        "row": 5,
        "kind": "html",
        "title": "Volume Usage By Index Directory",
        "query": "",
        "base": "",
        "text": "Volume Usage (GB)",
        "options": {}
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "Data Age By Index Directory",
        "query": "fields title, bucket_dirs.home.event_min_time, bucket_dirs.cold.event_min_time, home_vol_name, cold_vol_name, datatype\n            | eval dir = \"home,cold\"\n            | makemv dir delim=\",\"\n            | mvexpand dir\n            | eval indexwithtype=title.\":\".datatype, title = case(dir == \"home\", title.\":home\", dir == \"cold\", title.\":cold\")\n            | eval data_age_home_day = if(dir == \"home\", round((now() - 'bucket_dirs.home.event_min_time') / 86400, 0), NULL)\n            | eval data_age_cold_day = if(dir == \"cold\", round((now() - 'bucket_dirs.cold.event_min_time') / 86400, 0), NULL)\n            | eval data_age_day = case(dir == \"home\", data_age_home_day, dir == \"cold\", data_age_cold_day)\n            | eval vol_name = case(dir == \"home\", home_vol_name, dir == \"cold\", cold_vol_name)\n            | where vol_name == \"$volume_name$\"\n            | sort - data_age_day\n            | fields title, data_age_home_day, data_age_cold_day, indexwithtype\n            | where NOT (isnull(data_age_home_day) AND isnull(data_age_cold_day))\n            | rename title as Index, data_age_home_day as \"home data age (days)\", data_age_cold_day as \"cold data age (days)\"",
        "base": "index_base_search",
        "text": "",
        "options": {
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Index Directories",
          "charting.axisTitleY.text": "Data Age (days)",
          "charting.legend.placement": "none"
        }
      },
      {
        "row": 6,
        "kind": "html",
        "title": "Data Age By Index Directory",
        "query": "",
        "base": "",
        "text": "Tip: you can adjust the height of the bar chart when there are many bars.",
        "options": {}
      },
      {
        "row": 8,
        "kind": "chart",
        "title": "Volume Size Over Time",
        "query": "index=_introspection host=$host$ sourcetype=splunk_disk_objects component=Volumes data.name=\"$volume_name$\"\n            | eval data.total_size = round('data.total_size' / 1024, 2)\n            | eval data.total_capacity = round('data.max_size' / 1024, 2)                    \n            | `dmc_timechart_for_disk_usage` partial=false $funcVolume$(data.total_size) as volume_usage, latest(data.total_capacity) as volume_capacity\n            | fields _time, volume_usage $capacityOverlay$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "area",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Volume Size (GB)",
          "charting.axisLabelsY.majorUnit": "1",
          "charting.legend.placement": "none",
          "charting.chart.overlayFields": "volume_capacity"
        }
      }
    ],
    "sourceSha256": "36a78698e7ca94e97426ba7088352066cd1656dac3fb3482be1af0fdab78baab"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "workload_management",
    "label": "Workload Management Overview",
    "description": "",
    "kind": "form",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Workload Management Status",
        "query": "| inputlookup dmc_assets\n          | rename serverName AS splunk_server\n          | where (match(search_group, \"dmc_group_\"))\n          | `dmc_set_group_label_and_sort(search_group)`\n          | stats values(label) AS roles by splunk_server\n          | makemv roles\n          | join type=outer splunk_server [rest splunk_server=* /services/server/info\n              | fields splunk_server, os_name, os_version]\n          | eval OS = 'os_name'.\" \".'os_version'\n          | join type=outer splunk_server [rest splunk_server=* /services/workloads/status/workload-management-status\n              | fields splunk_server, general.isSupported, general.enabled, general.error_message]\n          | eval Status = case('general.isSupported' = 0 OR isnull('general.isSupported'), \"Unsupported\", 'general.isSupported' = 1, \"Supported\").\" / \".case('general.enabled' = 0, \"Disabled\", 'general.enabled' = 1, \"Enabled\", isnull('general.enabled'), \"N/A\")\n          | fields splunk_server, roles, OS, Status, general.error_message\n          | rename splunk_server AS \"Instance\", roles AS Roles, general.error_message AS \"Error Messages\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Workload Pool Configuration",
        "query": "| inputlookup dmc_assets\n          | rename serverName AS splunk_server\n          | where (match(search_group, \"dmc_group_\"))\n          | `dmc_set_group_label_and_sort(search_group)`\n          | stats values(label) AS roles by splunk_server\n          | makemv roles\n          | join type=outer splunk_server [rest splunk_server=* /services/workloads/pools\n              | eval default_pool=if(category==\"search\" and default_category_pool==\"1\",(if(isNull('title'), \"Not Configured\", 'title')),NULL)\n              | eval ingest_pool=if(category==\"ingest\" and default_category_pool==\"1\",(if(isNull('title'), \"Not Configured\", 'title')),NULL)\n              | stats values(eval(if(title!=\"general\",title,NULL))) as pools values(default_pool) AS default_pool values(ingest_pool) AS ingest_pool by splunk_server]\n          | fields splunk_server, roles, default_pool, ingest_pool, pools\n          | rename splunk_server AS \"Instance\", roles AS Roles, default_pool AS \"Default Search Pool\", ingest_pool AS \"Default Ingest Pool\" pools AS \"All Pools\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Deployment-Wide $CPUFunctionLabel$ CPU Usage by Workload Pool",
        "query": "`dmc_set_index_introspection` search_group=\"$role$\" sourcetype=splunk_resource_usage component=PerProcess\n             | `dmc_rename_introspection_fields`\n             | `dmc_set_bin`\n             | stats sum(pct_cpu) as pct_cpu by host, workload_pool, _time\n             | `dmc_timechart` $CPUFunction$(pct_cpu) as pct_cpu by workload_pool",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "CPU Usage (%)",
          "charting.axisY.minimumNumber": "0"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Deployment-Wide $MemFuncLabel$ Physical Memory Usage by Workload Pool ",
        "query": "`dmc_set_index_introspection` search_group=\"$role$\" sourcetype=splunk_resource_usage component=PerProcess\n             | `dmc_rename_introspection_fields`\n             | `dmc_set_bin`\n             | stats sum(mem_used) as mem_used by host, workload_pool _time\n             | `dmc_timechart` $MemFunc$(mem_used) as mem_used by workload_pool",
        "base": "",
        "text": "",
        "options": {
          "charting.chart": "column",
          "charting.chart.stackMode": "stacked",
          "charting.legend.placement": "bottom",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "Memory Usage (MB)",
          "charting.axisY.minimumNumber": "0"
        }
      }
    ],
    "sourceSha256": "803b788cddb812c1fc564f44dd6b1ff598335badd2e32f90c1bcdda341ea96fe"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "workload_management_monitoring_distributed",
    "label": "Workload Management Monitoring: Distributed",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "host",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches aborted",
        "query": "| where wlm_action = \"abort\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches moved to alternate pool",
        "query": "| where wlm_action = \"move\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches triggering an alert",
        "query": "| where wlm_action = \"alert\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Number of searches per action triggered",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ host=$host$ sourcetype=wlm_*\n            | chart dc(search_id) AS search_count over wlm_action",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.nullValueMode": "connect",
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total # of searches",
          "charting.axisTitleX.text": "Action triggered",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Number of searches per action triggered",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ host=$host$ sourcetype=wlm_* | chart dc(search_id) over wlm_action by $SplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.nullValueMode": "connect",
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total # of searches",
          "charting.axisTitleX.text": "Action triggered",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Number of searches per action triggered over time",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ host=$host$ sourcetype=wlm_*\n              | `dmc_timechart` partial=f bins=200 dc(search_id) AS \"Search count\" by $SplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# of searches",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Overview of scheduled searches triggering rules",
        "query": "`dmc_set_index_internal` search_group=$role$ search_group=$dmc_group$ host=$host$ sourcetype=wlm_* search_type=\"scheduled*\"\n          | stats count(eval(wlm_action = \"alert\")) AS alert count(eval(wlm_action = \"move\")) AS move count(eval(wlm_action = \"abort\")) AS abort by search_id\n           | join type=outer search_id\n               [ search `dmc_set_index_introspection` search_group=$role$ search_group=$dmc_group$ host=$host$ sourcetype=splunk_resource_usage\n                 data.search_props.label::*  NOT data.search_props.type::ad-hoc\n                 | rename data.search_props.sid as search_id, data.search_props.label as search_name\n                | stats latest(search_name) AS search_name by search_id\n               ]\n          | stats sum(alert) as \"searches triggering an alert\", sum(move) as \"searches reclassified\", sum(abort) as \"searches aborted\" by search_name",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "0066e763742d85adf7928cc806748cf9e3ee21bb3d8d9ae46b89fc46647115b5"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "workload_management_monitoring_instance",
    "label": "Workload Management Monitoring: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "host",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches aborted",
        "query": "| where wlm_action = \"abort\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches moved to alternate pools",
        "query": "| where wlm_action = \"move\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Number of searches triggering an alert",
        "query": "| where wlm_action = \"alert\" | fields search_count",
        "base": "base_total_search_count",
        "text": "",
        "options": {
          "height": "80px"
        }
      },
      {
        "row": 2,
        "kind": "chart",
        "title": "Number of searches per action triggered",
        "query": "`dmc_set_index_internal` sourcetype=wlm_* host=$host$ |\n           chart dc(search_id) AS search_count over wlm_action",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.nullValueMode": "connect",
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total # of searches",
          "charting.axisTitleX.text": "Action triggered",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Number of searches per action triggered",
        "query": "`dmc_set_index_internal` sourcetype=wlm_* host=$host$ | chart dc(search_id) over wlm_action by $SplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.chart.nullValueMode": "connect",
          "charting.chart": "bar",
          "charting.chart.stackMode": "stacked",
          "charting.axisTitleY.text": "Total # of searches",
          "charting.axisTitleX.text": "Action triggered",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Number of searches per action triggered over time",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=wlm_*\n              | `dmc_timechart` partial=f bins=200 dc(search_id) AS \"Search count\" by $SplitByVariable$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# of searches",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Overview of scheduled searches triggering rules",
        "query": "`dmc_set_index_internal` host=$host$ sourcetype=wlm_* search_type=\"scheduled*\"\n          | stats count(eval(wlm_action = \"alert\")) AS alert count(eval(wlm_action = \"move\")) AS move count(eval(wlm_action = \"abort\")) AS abort by search_id\n          | join type=outer search_id\n               [ search `dmc_set_index_introspection` host=$host$ sourcetype=splunk_resource_usage\n                 data.search_props.label::*  NOT data.search_props.type::ad-hoc\n                 | rename data.search_props.sid as search_id, data.search_props.label as search_name\n\t\t | stats latest(search_name) AS search_name by search_id\n               ]\n          | stats sum(alert) as \"searches triggering an alert\", sum(move) as \"searches reclassified\", sum(abort) as \"searches aborted\" by search_name",
        "base": "",
        "text": "",
        "options": {}
      }
    ],
    "sourceSha256": "a59fa68041372c57a130f419a2d4a4f226d1d0a78a1ca01f28cff415bfc3f0d1"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "workload_management_per_pool_deployment",
    "label": "Workload Management Activity: Deployment",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Workload Management Pool Limits",
        "query": "| rest splunk_server_group=$role$ splunk_server_group=\"$dmc_group$\" /services/workloads/pools\n          | rename category as pool_type\n          | eval pool_and_type = title.\" (\".pool_type.\")\"\n          | eventstats dc(splunk_server) as total_instance_count \n          | stats avg(mem_limit) as mem_limit dc(splunk_server) as instance_count max(total_instance_count) as total_instance_count values(ingest_pool) as ingest_pool values(pool_and_type) as pool_and_type by title, pool_type\n          | eval instance_count=instance_count.\"/\".total_instance_count\n          | eval mem_limit=round(mem_limit/1024/1024, 0)\n          | rename title as workload_pool\n          | join workload_pool type=outer\n              [rest splunk_server_group=$role$ splunk_server_group=\"$dmc_group$\" /services/server/status/resource-usage/splunk-processes\n                | stats sum(mem_used) as mem_used sum(pct_cpu) as pct_cpu by splunk_server, workload_pool\n                | stats avg(mem_used) as avg_mem_used avg(pct_cpu) as avg_pct_cpu by workload_pool\n              ]\n          | eval avg_mem_used=if(isNULL('avg_mem_used'), 0, round(avg_mem_used, 2))\n          | eval avg_num_cores = if(isNull('avg_pct_cpu'), 0, round(avg_pct_cpu/100.0, 2))\n          | fields workload_pool, pool_type, instance_count, mem_limit, avg_mem_used, avg_num_cores\n          | rename workload_pool as \"Workload Pool\" pool_type as \"Pool Type\" instance_count as \"Instance Count\" mem_limit as \"Memory Limit (MB)\" avg_mem_used as \"Avg Memory Used Per Instance (MB)\" avg_num_cores as \"Avg CPU Used Per Instance (# of Cores)\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "$resourceFuncLabel$ Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$dmc_group$\" data.workload_pool=$wlm_pool$ data.workload_pool_type=$wlm_pool_type$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(mem_used) AS mem_used_dedup by _time, $resourceSplitBySearch$, pid, host\n        | stats sum(mem_used_dedup) AS sum_mem_used by _time, $resourceSplitBySearch$, host\n        | `dmc_timechart` $resourceFunction$(sum_mem_used) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBySearch$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart.overlayFields": "Memory Limit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "MB"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$resourceFuncLabel$ Memory Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$dmc_group$\" data.workload_pool=$wlm_pool$ data.workload_pool_type=$wlm_pool_type$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(mem_used) AS mem_used_dedup by _time, $resourceSplitByIngest$, pid, host\n        | stats sum(mem_used_dedup) AS sum_mem_used by _time, $resourceSplitByIngest$, host\n        | `dmc_timechart` $resourceFunction$(sum_mem_used) AS \"$resourceFunction$ of resource usage\" by $resourceSplitByIngest$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart.overlayFields": "Memory Limit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "MB"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$dmc_group$\" data.workload_pool=$wlm_pool$ data.workload_pool_type=$wlm_pool_type$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(pct_cpu) AS pct_cpu_dedup by _time, $resourceSplitBySearch$, pid, host\n        | stats sum(pct_cpu_dedup) AS sum_pct_cpu by _time, $resourceSplitBySearch$, host\n        | eval sum_pct_cpu = round(sum_pct_cpu/ 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_pct_cpu) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBySearch$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "# Of Cores"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` search_group=$role$ search_group=\"$dmc_group$\" data.workload_pool=$wlm_pool$ data.workload_pool_type=$wlm_pool_type$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(pct_cpu) AS pct_cpu_dedup by _time, $resourceSplitByIngest$, pid, host\n        | stats sum(pct_cpu_dedup) AS sum_pct_cpu by _time, $resourceSplitByIngest$, host\n        | eval sum_pct_cpu = round(sum_pct_cpu/ 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_pct_cpu) AS \"$resourceFunction$ of resource usage\" by $resourceSplitByIngest$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none",
          "charting.axisTitleY.text": "# Of Cores"
        }
      }
    ],
    "sourceSha256": "d533f13f1128885acf34b7fa549f1230a49bc9d1fa26cd9bbf2728689fb85e7c"
  },
  {
    "app": "splunk_monitoring_console",
    "id": "workload_management_per_pool_instance",
    "label": "Workload Management Activity: Instance",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "radio",
        "token": "role",
        "label": "Role",
        "default": "dmc_group_search_head",
        "choices": [
          {
            "value": "dmc_group_search_head",
            "label": "Search Heads"
          },
          {
            "value": "dmc_group_indexer",
            "label": "Indexers"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "dmc_group",
        "label": "Group",
        "default": "",
        "choices": [
          {
            "value": "*",
            "label": "All"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "splunk_server",
        "label": "Instance",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Select views: \n          \n            All\n            Snapshot\n            Historical",
        "options": {}
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Workload Management Pool Limits",
        "query": "| rest splunk_server=$splunk_server$ /services/workloads/pools\n          | rename title AS workload_pool category AS pool_type\n          | eval mem_limit=if(isNULL(mem_limit), 0, round(mem_limit/1024/1024, 0))\n          | join workload_pool type=outer\n              [rest splunk_server=$splunk_server$ /services/server/status/resource-usage/splunk-processes\n                | stats sum(mem_used) as mem_used sum(pct_cpu) as pct_cpu by workload_pool\n              ]\n          | fields workload_pool, pool_type, mem_limit, mem_used, cpu_cores_used\n          | eval cpu_cores_used = if(isNull('pct_cpu'), 0, round(pct_cpu / 100.0, 2))\n          | eval mem_used = if(isNULL('mem_used'), 0, round(mem_used, 2))\n          | rename workload_pool as \"Workload Pool\", pool_type as \"Pool Type\" mem_used as \"Memory Used (MB)\", cpu_cores_used as \"CPU used (# of cores)\" mem_limit as \"Memory Limit (MB)\"",
        "base": "",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "$resourceFuncLabel$ Memory Usage",
        "query": "`dmc_set_index_introspection` host=$splunk_server$ data.workload_pool=$wlm_pool$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(mem_used) AS mem_used_dedup by _time, $resourceSplitBySearch$, pid\n        | stats sum(mem_used_dedup) AS sum_mem_used by _time,  $resourceSplitBySearch$\n        | `dmc_timechart` $resourceFunction$(sum_mem_used) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBySearch$\n        | eval mem_limit = [rest /services/workloads/pools/$wlm_pool$ splunk_server=$splunk_server$\n                             |eval mem_limit = if(isNULL(mem_limit), 0, round(mem_limit/1024/1024, 0))\n                             |return $mem_limit]\n        | rename mem_limit as \"Memory Limit\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart.overlayFields": "\"Memory Limit\"",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "MB",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 5,
        "kind": "chart",
        "title": "$resourceFuncLabel$ Memory Usage",
        "query": "`dmc_set_index_introspection` host=$splunk_server$ data.workload_pool=$wlm_pool$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(mem_used) AS mem_used_dedup by _time, $resourceSplitByIngest$, pid\n        | stats sum(mem_used_dedup) AS sum_mem_used by _time,  $resourceSplitByIngest$\n        | `dmc_timechart` $resourceFunction$(sum_mem_used) AS \"$resourceFunction$ of resource usage\" by $resourceSplitByIngest$\n        | eval mem_limit = [rest /services/workloads/pools/$wlm_pool$ splunk_server=$splunk_server$\n                             |eval mem_limit = if(isNULL(mem_limit), 0, round(mem_limit/1024/1024, 0))\n                             |return $mem_limit]\n        | rename mem_limit as \"Memory Limit\"",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart.overlayFields": "\"Memory Limit\"",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "MB",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 6,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` host=$splunk_server$ data.workload_pool=$wlm_pool$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(pct_cpu) AS pct_cpu_dedup by _time, $resourceSplitBySearch$, pid\n        | stats sum(pct_cpu_dedup) AS sum_pct_cpu by _time,  $resourceSplitBySearch$\n        | eval sum_pct_cpu = round(sum_pct_cpu/ 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_pct_cpu) AS \"$resourceFunction$ of resource usage\" by $resourceSplitBySearch$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# Of Cores",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 7,
        "kind": "chart",
        "title": "$resourceFuncLabel$ CPU Usage",
        "query": "`dmc_set_index_introspection` host=$splunk_server$ data.workload_pool=$wlm_pool$ sourcetype=splunk_resource_usage component=PerProcess\n        | `dmc_rename_introspection_fields`\n        | `dmc_set_bin`\n        | eval process=process.\" \".args\n        | stats latest(pct_cpu) AS pct_cpu_dedup by _time, $resourceSplitByIngest$, pid\n        | stats sum(pct_cpu_dedup) AS sum_pct_cpu by _time,  $resourceSplitByIngest$\n        | eval sum_pct_cpu = round(sum_pct_cpu/ 100.0, 2)\n        | `dmc_timechart` $resourceFunction$(sum_pct_cpu) AS \"$resourceFunction$ of resource usage\" by $resourceSplitByIngest$",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "visible",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.scale": "linear",
          "charting.axisY.scale": "linear",
          "charting.axisY2.enabled": "false",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "column",
          "charting.chart.nullValueMode": "connect",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "stacked",
          "charting.chart.style": "shiny",
          "charting.drilldown": "all",
          "charting.layout.splitSeries": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.placement": "right",
          "charting.axisTitleX.text": "Time",
          "charting.axisTitleY.text": "# Of Cores",
          "list.drilldown": "full",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "false",
          "table.drilldown": "all",
          "table.wrap": "1",
          "type": "list",
          "wrap": "true",
          "dataOverlayMode": "none"
        }
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Top 10 Memory-Consuming Searches In This Pool",
        "query": "`dmc_set_index_introspection` host=$splunk_server$ data.workload_pool=$wlm_pool$ sourcetype=splunk_resource_usage data.search_props.mode!=RT\n        | `dmc_rename_introspection_fields`\n        | stats max(elapsed) as runtime max(mem_used) as mem_used earliest(_time) as _time by sid, label, provenance, type, mode, app, role, search_head, user\n        | eval mem_used = round(mem_used, 2)\n        | sort 10 - mem_used\n        | fields - day, hour, minute, second\n        | eval _time = strftime(_time,\"%+\")\n        | rename sid as SID, label as \"Search Name\",mem_used as \"Memory Usage (MB)\", provenance AS Provenance, type as Type, mode as Mode, app as App, role as Role, search_head as \"Search Head\", user as User, _time as Started, runtime as Runtime\n        | fields SID, \"Search Name\",\"Memory Usage (MB)\", Provenance, Type, Mode, App, Role, \"Search Head\", User, Started, Runtime\n        | fieldformat Runtime = `dmc_convert_runtime(Runtime)`",
        "base": "",
        "text": "",
        "options": {
          "wrap": "true",
          "rowNumbers": "true",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "count": "10"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Top 10 Memory-Consuming Searches In This Pool",
        "query": "",
        "base": "",
        "text": "Click on a SID to see more details",
        "options": {}
      },
      {
        "row": 8,
        "kind": "table",
        "title": "Details of SID: $top10_drilldown_sid$",
        "query": "`dmc_set_index_audit` action=search sourcetype=audittrail\n           [ localop | stats count\n             | eval search_id = replace(\"$top10_drilldown_sid$\", \"^remote_[^_]*_\", \"\")\n             | table search_id ]\n           [ localop | stats count\n             | eval earliest = $top10_drilldown_earliest$ - 86400\n             | table earliest ]\n           [ localop | stats count\n             | eval host = if(like(\"$top10_drilldown_sid$\", \"remote_%\"), \"*\", \"$host$\")\n             | table host ]\n           latest=\"$top10_drilldown_latest$\"\n          | stats values(savedsearch_name) AS search_name values(result_count) AS result_count values(event_count) AS event_count values(scan_count) AS scan_count values(total_run_time) AS search_run_time values(host) as host values(search) AS search_string by search_id\n          | transpose\n          | rename column as Property, \"row 1\" as Value",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "off",
          "wrap": "true"
        }
      },
      {
        "row": 8,
        "kind": "html",
        "title": "Details of SID: $top10_drilldown_sid$",
        "query": "",
        "base": "",
        "text": "Please try to choose a larger time range if this panel produces no result.\n         \n        Close this panel",
        "options": {}
      }
    ],
    "sourceSha256": "b0c8a268561069ecfed48818de1f4cd87af31c63d4e323a4156eedc4e576cce9"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "administration",
    "label": "Administration",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "6d22262678dffd1154dd224fa51526a7585637ba01a186b88aad2bdd91419f1a"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "home",
    "label": "Home",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "336f6b0667810d068f4d8686ad9b6c40367145c8f2f90ffa8aca3ade45a8d300"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "kvstore_dashboard_client",
    "label": "KV Store Collections Status",
    "description": "If you’re running into issues with the Connected Experiences apps, Splunk Support might ask you to use this dashboard to check the KV Store status.",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "app",
        "label": "App",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "collection",
        "label": "Collection",
        "default": "",
        "choices": []
      },
      {
        "type": "dropdown",
        "token": "owner",
        "label": "Owner",
        "default": "",
        "choices": []
      },
      {
        "type": "text",
        "token": "limit",
        "label": "Max Number of Results",
        "default": "10",
        "choices": []
      },
      {
        "type": "text",
        "token": "sort",
        "label": "Sort By",
        "default": "",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "KV Store Response",
        "query": "| table result",
        "base": "kvstore",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      }
    ],
    "sourceSha256": "f313d46c20fb82e06576748be24d7fde5e5231db9f606fef4bdffb935da5103f"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "mdm_saml",
    "label": "MDM with SAML",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a7a618ddf10dea2fc68e8137838806fb0199e20b712c021d2405f472bfe6e284"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "opt_in",
    "label": "SOC2 Compliance Opt In Page",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "a2c0ac4027db758c6daf6373041c1bec6ebeaef8507eb186b3392606723b0a6e"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "recent_ssg_dashboard_activity",
    "label": "Recent SSG Dashboard Activity",
    "description": "Use this dashboard to troubleshoot a Dashboard that isn’t loading. Select a time range to get a list of most recently viewed Dashboards.",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "field1",
        "label": "field1",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Recent Dashboards Requested by Device",
        "query": "| stats latest(_time) as _time, values(subscription_id) as subscription_ids, values(search_key) as search_keys by dashboard_user dashboard_app dashboard_name dashboard_id device_id current_user | stats count(search_keys) as search_count, latest(_time) as _time by dashboard_user dashboard_app dashboard_name dashboard_id device_id current_user| sort - _time",
        "base": "base_create",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "row",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Dashboard",
        "query": "| table label",
        "base": "base_dashboard_view",
        "text": "",
        "options": {
          "drilldown": "all"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Dashboard Tags",
        "query": "| table tags",
        "base": "base_dashboard_view",
        "text": "",
        "options": {
          "drilldown": "all"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Current User",
        "query": "| table user",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Device Name",
        "query": "| eval device_name_str = if(device_name==\"\", \"None\", device_name)| table device_name_str",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Device Type",
        "query": "| table device_type",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Device ID",
        "query": "| eval device = substr(device_id, 0, 6) | table device",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Platform",
        "query": "| table platform",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Auth Method",
        "query": "| table auth_method",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Registration Method",
        "query": "| table registration_method",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "MDM",
        "query": "| eval mdm = if(device_management_method == \"not_mdm\", \"NO\", \"YES\") | table mdm",
        "base": "base_device_reg",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "single",
        "title": "Subscription Errors for ($dashboardId$)",
        "query": "|search log_level=ERROR | stats count as error_count | eval errors = if(error_count > 0, \"YES\", \"NONE\") | eval range=if(error_count > 0, \"severe\", \"low\") | table errors, range",
        "base": "base_dashboard_subscriptions",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "all",
          "rangeColors": "[\"0x53a051\",\"0xdc4e41\"]",
          "rangeValues": "[0]",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Error Count by ($dashboardId$) Subscriptions",
        "query": "| search log_level=ERROR | stats count by subscription_id",
        "base": "base_dashboard_subscriptions",
        "text": "",
        "options": {
          "count": "20",
          "dataOverlayMode": "none",
          "drilldown": "row",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 5,
        "kind": "table",
        "title": "Subscriptions ($dashboardId$)",
        "query": "| search dashboard_id=\"$dashboardId$\" device_id=\"$deviceId$\" current_user=\"$currentUser$\" | table _time, search_type_id, subscription_id, search_key, request_id",
        "base": "base_create",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "none",
          "drilldown": "row",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 6,
        "kind": "single",
        "title": "Subscription Errors for $subscriptionId$",
        "query": "| search log_level=ERROR | stats count as error_count | eval errors = if(error_count > 0, \"YES\", \"NONE\") | eval range=if(error_count > 0, \"severe\", \"low\") | table errors, range",
        "base": "base_subscription",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "all",
          "rangeColors": "[\"0x53a051\",\"0xdc4e41\"]",
          "rangeValues": "[0]",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Type",
        "query": "| search \"Subscription Update Sent\" OR \"Skipping subscription update\" OR \"Send Post Process Single Subscription Update\" | head 1 | table type",
        "base": "base_subscription",
        "text": "",
        "options": {}
      },
      {
        "row": 7,
        "kind": "single",
        "title": "Currently Subscribed",
        "query": "| stats count as count\n                 | eval ok = if(count > 0, \"NO\", \"YES\")\n                 | eval range=if(count > 0, \"severe\", \"low\")\n                 | table ok, range",
        "base": "base_unsubscribe",
        "text": "",
        "options": {}
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Total Updates",
        "query": "|stats count| table count",
        "base": "base_updates_sent",
        "text": "",
        "options": {
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]"
        }
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Updates Skipped",
        "query": "| search \"Skipping subscription update\" | stats count | table count",
        "base": "base_subscription",
        "text": "",
        "options": {
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]"
        }
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Average Update Latency",
        "query": "| stats avg(latency) as avg_latency by update_id | table avg_latency",
        "base": "base_updates_sent",
        "text": "",
        "options": {
          "numberPrecision": "0.000",
          "rangeColors": "[\"0x53a051\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[1,5,10]",
          "unit": "s",
          "useColors": "1"
        }
      },
      {
        "row": 8,
        "kind": "single",
        "title": "Total Processing Time",
        "query": "| stats max(_time) as maxtime min(_time) as mintime | eval difference=maxtime-mintime | table difference",
        "base": "base_subscription",
        "text": "",
        "options": {
          "numberPrecision": "0.000",
          "rangeColors": "[\"0x53a051\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[1,5,10]",
          "unit": "s",
          "useColors": "1"
        }
      },
      {
        "row": 9,
        "kind": "table",
        "title": "Updates: $subscriptionId$",
        "query": "",
        "base": "base_updates_sent",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 10,
        "kind": "event",
        "title": "Raw Events: $subscriptionId$",
        "query": "",
        "base": "base_subscription",
        "text": "",
        "options": {
          "count": "10",
          "list.drilldown": "none",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "0",
          "table.drilldown": "all",
          "table.sortDirection": "asc",
          "table.wrap": "1",
          "type": "list"
        }
      }
    ],
    "sourceSha256": "721137cabc4341e6a9691e131526a605fc8dc4aabbbcfc6655a067bdb55f8f47"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "request_tracing_dashboard",
    "label": "Request Tracing",
    "description": "Troubleshoot and trace a particular request. Select a time range and a request ID to get troubleshooting logs and a stack trace.",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "field1",
        "label": "field1",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "text",
        "token": "requestId",
        "label": "Request ID",
        "default": "$requestId$",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "All Requests: Click on row to trace particular request",
        "query": "| table _time, request_id, type, current_user, device_id, latency",
        "base": "base",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "none",
          "drilldown": "row",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Request Errors for $requestId$",
        "query": "|search log_level=ERROR | stats count as error_count | eval errors = if(error_count > 0, \"YES\", \"NONE\") | eval range=if(error_count > 0, \"severe\", \"low\") | table errors, range",
        "base": "base_request",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "all",
          "rangeColors": "[\"0x53a051\",\"0xdc4e41\"]",
          "rangeValues": "[0]",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Type",
        "query": "|search request_id=$requestId$ | table type",
        "base": "base",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Current User",
        "query": "|search request_id=$requestId$ | table current_user",
        "base": "base",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Device ID",
        "query": "|search request_id=$requestId$ | eval device = substr(device_id, 0, 6) | table device",
        "base": "base",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Rest API Call Timing",
        "query": "| rex field=_raw \"(?<uri>(GET|POST|DELETE) uri=https.*?), \" | chart sum(time_taken) over uri",
        "base": "base_request",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.drilldown": "all",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Total Latency",
        "query": "|search request_id=$requestId$ | table latency",
        "base": "base",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "none",
          "drilldown": "none",
          "numberPrecision": "0.000",
          "rangeColors": "[\"0x53a051\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[1,5,10]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unit": "s",
          "unitPosition": "after",
          "useColors": "1",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "HTTP Call Response Time Buckets (seconds)",
        "query": "| bucket time_taken | stats count by time_taken",
        "base": "base_request",
        "text": "",
        "options": {
          "charting.chart": "pie",
          "charting.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "event",
        "title": "Raw Events: $requestId$",
        "query": "",
        "base": "base_request",
        "text": "",
        "options": {
          "count": "10",
          "list.drilldown": "none",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "0",
          "table.drilldown": "all",
          "table.sortDirection": "asc",
          "table.wrap": "1",
          "type": "list"
        }
      }
    ],
    "sourceSha256": "9638c24bb300f15d28c313514520f3198efb7e484bf045bf631bc505e67df6c8"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "saml_troubleshooting_dashboard",
    "label": "SAML Troubleshooting Dashboard",
    "description": "Dashboard to help troubleshoot SAML setup issues with Splunk Secure Gateway",
    "kind": "dashboard",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "",
        "query": "| makeresults | eval x = \"Test JWT Integration\" | fields x",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Are JWT Tokens Enabled",
        "query": "|rest services/ssg/registration/tokens_enabled dashboard_format=true\n| fields tokens_enabled\n| eval are_tokens_enabled=if( tokens_enabled=\"1\",\"Yes\",\"No\" )\n| eval range=if(are_tokens_enabled=\"Yes\", \"low\", \"severe\")\n| table are_tokens_enabled, range",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "JWT Token Test",
        "query": "| fields JWT\n| eval result=if(isnull(JWT), \"Failed\", \"Success\")\n| eval range=if(result=\"Success\", \"low\", \"severe\")\n| table  result, range",
        "base": "test_jwt",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Token Expiry",
        "query": "| rest services/ssg/registration/test_jwt dashboard_format=true \n| fields token_expiration\n| eval result=if(isnull(token_expiration), \"Error Occured\", token_expiration)\n| eval range=if(result=\"Error Occured\", \"severe\", \"low\")\n| table  result, range",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Error Type",
        "query": "| fields error_type, message\n| eval is_error = if(isnull(error_type), \"false\", \"true\")\n| eval msg = if(is_error==\"true\", error_type, \"No Error\")\n| eval range=if(msg=\"No Error\", \"low\", \"severe\")\n| table msg, range, is_error",
        "base": "test_jwt",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Error Message",
        "query": "| fields error_type, message\n| eval is_error = if(isnull(message), \"false\", \"true\")\n| eval msg = if(is_error==\"true\", message, \"No Error\")\n| table msg",
        "base": "test_jwt",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "",
        "query": "| makeresults | eval x = \"Validate SAML Configuration\" | fields x",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "SAML Setup Checks",
        "query": "|rest services/ssg/registration/correct_saml_setup dashboard_format=true\n| fields attributeQueryRequestSigned, attributeQueryResponseSigned, attributeQuerySoapUsername, idpAttributeQueryUrl, scriptPath, scriptTimeout, getUserInfoTtl, useAuthExtForTokenAuthOnly,scriptFunctions, scriptSecureArguments, SAML\n| eval attributeQueryRequestSigned=if(attributeQueryRequestSigned=0, \"false\", \"true\")\n| eval attributeQueryResponseSigned=if(attributeQueryResponseSigned=0, \"false\", \"true\")\n| eval attributeQuerySoapUsername=if(attributeQuerySoapUsername=0, \"false\", \"true\")\n| eval idpAttributeQueryUrl=if(idpAttributeQueryUrl=0, \"false\", \"true\")\n| eval scriptPath=if(scriptPath=0, \"false\", \"true\")\n| eval scriptTimeout=if(scriptTimeout=0, \"false\", \"true\")\n| eval getUserInfoTtl=if(getUserInfoTtl=0, \"false\", \"true\")\n| eval useAuthExtForTokenAuthOnly=if(useAuthExtForTokenAuthOnly=0, \"false\", \"true\")\n| eval scriptFunctions=if(scriptFunctions=0, \"false\", \"true\")\n| eval scriptSecureArguments=if(scriptSecureArguments=0, \"false\", \"true\")\n| eval SAML=if(SAML=0, \"false\", \"true\")",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "single",
        "title": "",
        "query": "| makeresults | eval x = \"SAML Error Logs\" | fields x",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      },
      {
        "row": 5,
        "kind": "event",
        "title": "SAML Provider Errors",
        "query": "index=_internal sourcetype=splunkd ERROR AuthenticationProviderSAML",
        "base": "",
        "text": "",
        "options": {
          "list.drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 5,
        "kind": "event",
        "title": "User Management Errors",
        "query": "index=_internal sourcetype=splunkd ERROR UserManagerPro",
        "base": "",
        "text": "",
        "options": {
          "list.drilldown": "none",
          "refresh.display": "progressbar"
        }
      }
    ],
    "sourceSha256": "b029462eef4af6accec861340eddd64fdf86738104ab4fc1cf39fe7c1163e2f8"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "secure_gateway_status_dashboard",
    "label": "Secure Gateway Status Dashboard",
    "description": "",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "field1",
        "label": "Time Interval",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Secure Gateway Status",
        "query": "index=\"_internal\" source=\"*secure_gateway*\" aiohttp_wss_protocol \"Received Pong\"\n              | head 1 | stats count as pong_count\n              | eval spacebridge_up = if(pong_count > 0, \"Connected\", \"Not Connected\")\n              | eval range=if(pong_count > 0, \"low\", \"severe\")\n              | table spacebridge_up, range",
        "base": "",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "block",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 0,
        "kind": "single",
        "title": "KV Store Status",
        "query": "| rest services/kvstore/status\n              | search current.disabled = 0\n              | fields current.status\n              | eval upper=upper('current.status')\n              | eval range=if(upper=\"READY\", \"low\", \"severe\")\n              | table upper range",
        "base": "",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "block",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 1,
        "kind": "html",
        "title": "",
        "query": "",
        "base": "",
        "text": "Secure Gateway Reachability",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Websocket",
        "query": "| noop | checkssgmobilewss\n              | eval ok = if(websocket > 0, \"OK\", \"Failed\")\n              | eval range=if(websocket > 0, \"low\", \"severe\")\n              | table ok, range",
        "base": "",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "none",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "HTTPS (Sync)",
        "query": "| noop | checkssgmobilehttps\n              | eval ok = if(https_sync > 0, \"OK\", \"Failed\")\n              | eval range=if(https_sync > 0, \"low\", \"severe\")\n              | table ok, range",
        "base": "",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "none",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "HTTPS (Async)",
        "query": "| noop | checkssgmobileasync\n              | eval ok = if(https_async > 0, \"OK\", \"Failed\")\n              | eval range=if(https_async > 0, \"low\", \"severe\")\n              | table ok, range",
        "base": "",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "none",
          "rangeColors": "[\"0x53a051\",\"0xdc4e41\"]",
          "rangeValues": "[0]",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 3,
        "kind": "chart",
        "title": "Messages Received and Sent by Secure Gateway",
        "query": "index=\"_internal\" source=\"*secure_gateway*\" message=\"RECEIVED_ENVELOPE\" OR message=\"SENT_BACK\"\n              | bin span=2min _time\n              | timechart span=2m count by message",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "collapsed",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.abbreviation": "none",
          "charting.axisX.scale": "linear",
          "charting.axisY.abbreviation": "none",
          "charting.axisY.scale": "linear",
          "charting.axisY2.abbreviation": "none",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.showDataLabels": "none",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "none",
          "charting.layout.splitSeries": "0",
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.mode": "standard",
          "charting.legend.placement": "bottom",
          "charting.lineWidth": "2",
          "refresh.display": "progressbar",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium"
        }
      },
      {
        "row": 3,
        "kind": "table",
        "title": "Average Request Latency By Type",
        "query": "index=\"_internal\" sourcetype=\"secure_gateway_app_internal_log\" message_processor process_request_list OR process_message NOT ERROR\n               | transaction request_id startswith=\"process_request_list\" endswith=\"Finished processing\"\n               | stats count(duration), avg(duration) by type\n               | rename avg(duration) as latency\n               | rename count(duration) as count\n               | table type, count, latency",
        "base": "",
        "text": "",
        "options": {
          "count": "10",
          "drilldown": "none",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Error Count By Module Name",
        "query": "index=\"_internal\" sourcetype=\"secure_gateway_app_internal_log\" log_level=ERROR\n              | bin span=2min _time\n              | timechart span=2m count by app_name",
        "base": "",
        "text": "",
        "options": {
          "charting.axisTitleX.visibility": "collapsed",
          "charting.chart": "line",
          "charting.drilldown": "all",
          "charting.legend.placement": "bottom",
          "height": "300",
          "refresh.display": "progressbar",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium"
        }
      },
      {
        "row": 4,
        "kind": "chart",
        "title": "Websocket Disconnections Count",
        "query": "index=\"_internal\" source=\"*secure_gateway*\" protocol \"Websocket connection was closed\"\n              | bin span=1h _time\n              | timechart span=1h count",
        "base": "",
        "text": "",
        "options": {
          "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
          "charting.axisLabelsX.majorLabelStyle.rotation": "0",
          "charting.axisTitleX.visibility": "collapsed",
          "charting.axisTitleY.visibility": "visible",
          "charting.axisTitleY2.visibility": "visible",
          "charting.axisX.abbreviation": "none",
          "charting.axisX.scale": "linear",
          "charting.axisY.abbreviation": "none",
          "charting.axisY.scale": "linear",
          "charting.axisY2.abbreviation": "none",
          "charting.axisY2.enabled": "0",
          "charting.axisY2.scale": "inherit",
          "charting.chart": "line",
          "charting.chart.bubbleMaximumSize": "50",
          "charting.chart.bubbleMinimumSize": "10",
          "charting.chart.bubbleSizeBy": "area",
          "charting.chart.nullValueMode": "gaps",
          "charting.chart.showDataLabels": "none",
          "charting.chart.sliceCollapsingThreshold": "0.01",
          "charting.chart.stackMode": "default",
          "charting.chart.style": "shiny",
          "charting.drilldown": "none",
          "charting.layout.splitSeries": "0",
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.legend.mode": "standard",
          "charting.legend.placement": "none",
          "charting.lineWidth": "2",
          "refresh.display": "progressbar",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium"
        }
      },
      {
        "row": 5,
        "kind": "event",
        "title": "Most Recent Error Messages",
        "query": "index=\"_internal\" sourcetype=\"secure_gateway_app_internal_log\" log_level=ERROR | head 10",
        "base": "",
        "text": "",
        "options": {
          "count": "3",
          "list.drilldown": "none",
          "list.wrap": "1",
          "maxLines": "3",
          "raw.drilldown": "none",
          "refresh.display": "progressbar",
          "table.drilldown": "none",
          "table.wrap": "1",
          "type": "list"
        }
      }
    ],
    "sourceSha256": "6cff44810c220e4532e021aba65234bf2b1de83e53e03c694a96596c57e2d50c"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "self_register",
    "label": "Self Register",
    "description": "",
    "kind": "view",
    "inputs": [],
    "panels": [],
    "sourceSha256": "2ed5c281897e5368b58105e3f90e4c9f595a2ebc3058b3af8233af5dd268ae9c"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "ssg_e2e_wss_test",
    "label": "End-to-End Websocket Test",
    "description": "Initiate a sample request to run an end-to-end websocket test for Splunk Secure Gateway, device authentication, and Spacebridge messaging. This dashboard requires JSON Web Tokens (JWT) to be enabled.",
    "kind": "form",
    "inputs": [
      {
        "type": "dropdown",
        "token": "request_mode",
        "label": "Mode",
        "default": "",
        "choices": [
          {
            "value": "clientSingleRequest",
            "label": "Single Request"
          },
          {
            "value": "clientSubscriptionMessage",
            "label": "Subscription Message"
          }
        ]
      },
      {
        "type": "dropdown",
        "token": "request_type",
        "label": "Request Type",
        "default": "",
        "choices": [
          {
            "value": "\"{\\\"versionGetRequest\\\": {}}\"",
            "label": "Version Get Request"
          },
          {
            "value": "\"{\\\"appListRequest\\\": {}}\"",
            "label": "App List Request"
          },
          {
            "value": "\"{\\\"dashboardListRequest\\\":{\\\"minimalList\\\": true}}\"",
            "label": "Minimal Dashboard List"
          },
          {
            "value": "\"{\\\"alertsListRequest\\\": {}}\"",
            "label": "Alerts List Request"
          },
          {
            "value": "\"{\\\"genericMessage\\\": {\\\"namespace\\\":\\\"com.splunk.app.tv\\\", \\\"message\\\":\\\"hello world\\\"}}\"",
            "label": "Generic Message Request"
          },
          {
            "value": "\"{\\\"dashboardListRequest\\\":     {\\\"dashboardIds\\\": [\\\"nobody/splunk_secure_gateway/secure_gateway_status_dashboard\\\"]} }\"",
            "label": "Dashboard List Request"
          },
          {
            "value": "\"{ \\\"clientSubscribeRequest\\\" :{ \\\"ttlSeconds\\\": 120,       \\\"dashboardVisualizationSubscribe\\\": {         \\\"dashboardVisualizationId\\\": {           \\\"dashboardId\\\":\\\"nobody/splunk_secure_gateway/secure_gateway_status_dashboard\\\",           \\\"visualizationId\\\": \\\"41cf0df3785e27534660e0cb5c55e55959f847d6563675484c99e3c348e84607/0/0\\\" } } } }\"",
            "label": "Client Subscribe Request"
          }
        ]
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Auth Code Validation",
        "query": "| eval status=if(auth_code_status=\"200\", \"Success\", if(auth_code_status=\"0\", \"Did not run\", \"Failure\"))\n| eval range=if(status=\"Success\", \"low\", \"severe\")\n| table  status range",
        "base": "e2e_test",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "block",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Server Side Registration",
        "query": "| eval status=if(server_registration_status=\"201\", \"Success\", if(server_registration_status=\"0\", \"Did not run\", \"Failure\"))\n| eval range=if(status=\"Success\", \"low\",  if(status=\"Failure\", \"severe\", \"guarded\"))\n| table status range",
        "base": "e2e_test",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "block",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Websocket Test",
        "query": "| eval status=if(wss_response=\"0\", \"Did Not Run\", if(wss_response!=\"[]\", \"Success\", \"Failure\"))\n| eval range=if(status=\"Success\", \"low\",  if(status=\"Failure\", \"severe\", \"guarded\"))\n| table status range",
        "base": "e2e_test",
        "text": "",
        "options": {
          "colorBy": "value",
          "colorMode": "block",
          "drilldown": "none",
          "numberPrecision": "0",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[0,30,70,100]",
          "showSparkline": "1",
          "showTrendIndicator": "1",
          "trellis.enabled": "0",
          "trellis.scales.shared": "1",
          "trellis.size": "medium",
          "trendColorInterpretation": "standard",
          "trendDisplayMode": "absolute",
          "unitPosition": "after",
          "useColors": "0",
          "useThousandSeparators": "1"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Error Message",
        "query": "| table  error | eval message=if(LEN(error) > 1, error, \"N/A\") | table message",
        "base": "e2e_test",
        "text": "",
        "options": {
          "drilldown": "none",
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "refresh.display": "progressbar",
          "useColors": "1"
        }
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Websocket Response",
        "query": "| table wss_response",
        "base": "e2e_test",
        "text": "",
        "options": {
          "drilldown": "cell"
        }
      }
    ],
    "sourceSha256": "dc8b2ce295c4c2d006d3a4b90cdd72ffb8166fbbcb421bf35752fb604470e7a2"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "subscription_search_inspector",
    "label": "Secure Gateway Subscription Inspector",
    "description": "This dashboard is intended to help troubleshoot issues with search processing logic within Splunk Secure Gateway. To get started click on one of the subscription iterations.",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "time",
        "label": "Time Range",
        "default": "\n        ",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "Subscription Iterations",
        "query": "index=_internal source=*secure* request_id=subscription-iteration* \n| rex \"subscription-iteration-(?<iteration>[0-9]+) \"\n| eval iteration=strftime(iteration, \"%Y-%m-%dT %H:%M:%S.%Z\")\n| stats count by request_id, iteration \n| sort -_time \n| reverse",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "row",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 1,
        "kind": "table",
        "title": "Current Active Searches Being Processed by SSG",
        "query": "index=_internal source=*secure* request_id=$request_id$ Processing pubsub subscription  \n| rex \"query=(?<query>[^\\,]+)\\,\"\n| eval last_updated=strftime(last_updated, \"%Y-%m-%dT %H:%M:%S.%Z\")\n| eval next_update=strftime(next_update, \"%Y-%m-%dT %H:%M:%S.%Z\")\n| table dashboard_id, query, subscribers, search_id, base, owner,input_tokens, last_updated, next_update, sid, search_key",
        "base": "",
        "text": "",
        "options": {
          "count": "25",
          "drilldown": "row",
          "refresh.display": "progressbar"
        }
      },
      {
        "row": 2,
        "kind": "table",
        "title": "Search Dispatch Status",
        "query": "|rest services/search/jobs/$sid$\n| table author, dispatchState, runDuration, doneProgress, isDone, eventCount, diskUsage, earliestTime, latestTime, sid",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      }
    ],
    "sourceSha256": "d7d7412e608b1597e5d69b472eccb24701a1270308cb9cb34cde42594f73d531"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "subscription_tracing_dashboard",
    "label": "Subscription Tracing",
    "description": "Use this dashboard to troubleshoot a panel that isn’t loading. Select a time range and a panel ID to get troubleshooting logs and a stack trace.",
    "kind": "form",
    "inputs": [
      {
        "type": "time",
        "token": "field1",
        "label": "field1",
        "default": "\n        ",
        "choices": []
      },
      {
        "type": "text",
        "token": "subscriptionId",
        "label": "Subscription ID",
        "default": "$subscriptionId$",
        "choices": []
      }
    ],
    "panels": [
      {
        "row": 0,
        "kind": "table",
        "title": "All Subscriptions",
        "query": "| table _time, subscription_id, search_key, request_id, device_id, current_user",
        "base": "base_create",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "none",
          "drilldown": "row",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 1,
        "kind": "single",
        "title": "Subscription Errors for $subscriptionId$",
        "query": "|search log_level=ERROR | stats count as error_count | eval errors = if(error_count > 0, \"YES\", \"NONE\") | eval range=if(error_count > 0, \"severe\", \"low\") | table errors, range",
        "base": "base_subscription",
        "text": "",
        "options": {
          "colorMode": "block",
          "drilldown": "all",
          "rangeColors": "[\"0x53a051\",\"0xdc4e41\"]",
          "rangeValues": "[0]",
          "refresh.display": "progressbar",
          "useColors": "0"
        }
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Type",
        "query": "| table type",
        "base": "base_updates",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Current User",
        "query": "| table current_user",
        "base": "base_create",
        "text": "",
        "options": {}
      },
      {
        "row": 2,
        "kind": "single",
        "title": "Device ID",
        "query": "| eval device = substr(device_id, 0, 6) | table device",
        "base": "base_create",
        "text": "",
        "options": {}
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Total Updates",
        "query": "| stats count | table count",
        "base": "base_updates",
        "text": "",
        "options": {
          "rangeColors": "[\"0x53a051\",\"0x0877a6\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Average Update Latency",
        "query": "| stats avg(latency) as avg_latency by update_id | table avg_latency",
        "base": "base_updates",
        "text": "",
        "options": {
          "numberPrecision": "0.000",
          "rangeColors": "[\"0x53a051\",\"0xf8be34\",\"0xf1813f\",\"0xdc4e41\"]",
          "rangeValues": "[1,5,10]",
          "unit": "s",
          "useColors": "1"
        }
      },
      {
        "row": 3,
        "kind": "single",
        "title": "Currently Subscribed",
        "query": "| stats count as count\n                 | eval ok = if(count > 0, \"NO\", \"YES\")\n                 | eval range=if(count > 0, \"severe\", \"low\")\n                 | table ok, range",
        "base": "base_unsubscribe",
        "text": "",
        "options": {}
      },
      {
        "row": 4,
        "kind": "table",
        "title": "Updates: $subscriptionId$",
        "query": "| table _time, update_id, type, latency",
        "base": "base_updates",
        "text": "",
        "options": {
          "count": "10",
          "dataOverlayMode": "none",
          "drilldown": "none",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "true"
        }
      },
      {
        "row": 5,
        "kind": "event",
        "title": "Raw Events: $subscriptionId$",
        "query": "",
        "base": "base_subscription",
        "text": "",
        "options": {
          "count": "10",
          "list.drilldown": "none",
          "list.wrap": "1",
          "maxLines": "5",
          "raw.drilldown": "full",
          "rowNumbers": "0",
          "table.drilldown": "all",
          "table.sortDirection": "asc",
          "table.wrap": "1",
          "type": "list"
        }
      }
    ],
    "sourceSha256": "2f0355cba256a477319ef9951157675215e4785ffaff00d05b37266ceff3fb17"
  },
  {
    "app": "splunk_secure_gateway",
    "id": "test_dashboard_single_value",
    "label": "Single Value Test",
    "description": "This single-value panel is a test to check if a simple dashboard loads in Splunk Secure Gateway. It helps identify possible causes for issues during troubleshooting.",
    "kind": "dashboard",
    "inputs": [],
    "panels": [
      {
        "row": 0,
        "kind": "single",
        "title": "Single Value",
        "query": "| makeresults | eval testValue=random() | table testValue",
        "base": "",
        "text": "",
        "options": {
          "drilldown": "none"
        }
      }
    ],
    "sourceSha256": "ffec283d4ee3a9068241c10a88f0e0f5afa96f6e66d3dd3588a657ad3dc4be4c"
  }
];
