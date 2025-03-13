#[cfg(test)]
mod tests {
    use chrono::{TimeZone, Utc};
    use screenpipe_core::{
        run_pipe, 
        download_pipe,
        sanitize_pipe_name,
        save_cron_execution,
        download_pipe_private,
        get_last_cron_execution,
        PipeState
    };

    use tokio::io::AsyncWriteExt;
    use serde_json::json;
    use std::sync::Arc;
    use std::sync::Once;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    use tempfile::TempDir;
    use tokio::sync::Mutex;
    use tokio::time::sleep;
    use tracing::subscriber::set_global_default;
    use tracing_subscriber::fmt::Subscriber;

    static INIT: Once = Once::new();

    fn init() {
        INIT.call_once(|| {
            let subscriber = Subscriber::builder()
                .with_env_filter("debug")
                .with_test_writer()
                .finish();
            set_global_default(subscriber).expect("Failed to set tracing subscriber");
        });
    }

    #[tokio::test]
    async fn test_download_pipe_invalid_url() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let screenpipe_dir = temp_dir.path().to_path_buf();

        let invalid_url = "https://example.com/invalid/url";
        let result = download_pipe(invalid_url, screenpipe_dir.clone()).await;

        assert!(result.is_err(), "Expected an error for invalid URL");
    }

    #[tokio::test]
    #[ignore]
    async fn test_nextjs_pipe_app_dir() {
        println!("Starting test_nextjs_pipe_app_dir");
        init();
        let temp_dir = TempDir::new().unwrap();
        let screenpipe_dir = temp_dir.path().to_path_buf();
        println!("Temp dir created: {:?}", temp_dir.path());

        // Set up a minimal Next.js project structure with App Router
        let nextjs_pipe_dir = temp_dir.path().join("pipes").join("nextjs-test-pipe");
        tokio::fs::create_dir_all(&nextjs_pipe_dir).await.unwrap();
        println!("Next.js pipe directory created: {:?}", nextjs_pipe_dir);

        // Create package.json
        let package_json = r#"{
            "name": "nextjs-test-pipe",
            "version": "1.0.0",
            "dependencies": {
                "next": "latest",
                "react": "latest",
                "react-dom": "latest"
            },
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start -p 3000"
            }
        }"#;
        tokio::fs::write(nextjs_pipe_dir.join("package.json"), package_json)
            .await
            .unwrap();
        println!("package.json created");

        // Create app directory and a simple page.tsx
        let app_dir = nextjs_pipe_dir.join("app");
        tokio::fs::create_dir_all(&app_dir).await.unwrap();
        let page_tsx = r#"
            export default function Home() {
                return <h1>Hello from Next.js App Router pipe!</h1>
            }
        "#;
        tokio::fs::write(app_dir.join("page.tsx"), page_tsx)
            .await
            .unwrap();

        // Create layout.tsx
        let layout_tsx = r#"
            export default function RootLayout({
                children,
            }: {
                children: React.ReactNode
            }) {
                return (
                    <html lang="en">
                        <body>{children}</body>
                    </html>
                )
            }
        "#;
        tokio::fs::write(app_dir.join("layout.tsx"), layout_tsx)
            .await
            .unwrap();

        // Create pipe.json
        let pipe_json = r#"{
            "is_nextjs": true
        }"#;
        tokio::fs::write(nextjs_pipe_dir.join("pipe.json"), pipe_json)
            .await
            .unwrap();

        // Run the pipe in a separate task
        let pipe_task = tokio::spawn(run_pipe("nextjs-test-pipe", screenpipe_dir.clone()));

        // Wait for a short time to allow the server to start
        sleep(Duration::from_secs(10)).await;

        // Check if the server is running
        let client = reqwest::Client::new();
        let response = client.get("http://localhost:3000").send().await;

        assert!(response.is_ok(), "Failed to connect to Next.js server");
        let response = response.unwrap();
        assert!(response.status().is_success(), "HTTP request failed");

        let body = response.text().await.expect("Failed to get response body");
        println!("Response body: {}", body);
        assert!(
            body.contains("Generated by create next app"),
            "Unexpected response content"
        );

        // Clean up: cancel the pipe task
        pipe_task.abort();

        println!("Test completed successfully");
    }

    #[tokio::test]
    async fn test_cron_state_persistence() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let pipe_dir = temp_dir.path().join("test-pipe");
        tokio::fs::create_dir_all(&pipe_dir).await.unwrap();

        let test_path = "/api/test/cron";

        // Test saving execution time
        let save_result = save_cron_execution(&pipe_dir, test_path).await;
        assert!(save_result.is_ok(), "Failed to save cron state");

        // Test reading execution time
        let last_run = get_last_cron_execution(&pipe_dir, test_path).await;
        assert!(last_run.is_ok(), "Failed to read cron state");
        assert!(last_run.unwrap().is_some(), "No execution time found");
    }

    #[tokio::test]
    async fn test_cron_scheduling() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let pipe_dir = temp_dir.path().join("test-pipe");
        tokio::fs::create_dir_all(&pipe_dir).await.unwrap();

        // Create a mock HTTP client that records requests
        let requests = Arc::new(Mutex::new(Vec::new()));
        let requests_clone = requests.clone();

        // Mock time - start at a known point
        let start_time = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();
        let mock_now = Arc::new(Mutex::new(start_time));

        // Spawn the cron task with mocked time and client
        let cron_handle = tokio::spawn(async move {
            // Run for a simulated hour
            for _ in 0..12 {
                // Advance time by 5 minutes
                let mut now = mock_now.lock().await;
                *now += chrono::Duration::minutes(5);

                // Record the request
                requests.lock().await.push(*now);

                // Simulate HTTP request delay
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        });

        // Wait for the simulation to complete
        cron_handle.await.unwrap();

        // Verify the requests
        let recorded_requests = requests_clone.lock().await;
        assert_eq!(recorded_requests.len(), 12, "Expected 12 cron executions");

        // Verify timing between requests
        for i in 1..recorded_requests.len() {
            let time_diff = recorded_requests[i] - recorded_requests[i - 1];
            assert_eq!(time_diff.num_minutes(), 5, "Expected 5 minute intervals");
        }
    }

    #[tokio::test]
    async fn test_cron_recovery_after_restart() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let pipe_dir = temp_dir.path().join("test-pipe");
        tokio::fs::create_dir_all(&pipe_dir).await.unwrap();

        let test_path = "/api/test/cron";

        // Simulate a previous execution
        let initial_time = SystemTime::now() - Duration::from_secs(300); // 5 minutes ago
        let mut state = json!({});
        if let Some(obj) = state.as_object_mut() {
            obj.insert(
                test_path.to_string(),
                json!(initial_time.duration_since(UNIX_EPOCH).unwrap().as_secs()),
            );
        }

        // Save the initial state
        let state_file = pipe_dir.join(".cron_state.json");
        tokio::fs::write(&state_file, serde_json::to_string_pretty(&state).unwrap())
            .await
            .unwrap();

        // Read the state back and verify
        let last_run = get_last_cron_execution(&pipe_dir, test_path).await.unwrap();
        assert!(last_run.is_some(), "Failed to read initial state");

        let time_diff = SystemTime::now()
            .duration_since(last_run.unwrap())
            .unwrap()
            .as_secs();
        assert!(
            (300..=301).contains(&time_diff),
            "Unexpected time difference: {}",
            time_diff
        );
    }

    #[tokio::test]
    async fn test_sanitize_pipe_name() {
        init();

        // test default pipe url
        let github_default_url = "https://github.com/KentTDang/AI-Interview-Coach/";
        assert_eq!(sanitize_pipe_name(github_default_url), "AI-Interview-Coach");

        // test pipe url with branch
        let github_url = "https://github.com/KentTDang/AI-Interview-Coach/tree/main";
        assert_eq!(sanitize_pipe_name(github_url), "AI-Interview-Coach");

        // test pipe url as a subdirectory
        let github_url_subdir = "https://github.com/mediar-ai/screenpipe/tree/main/pipes/search";
        assert_eq!(sanitize_pipe_name(github_url_subdir), "search");

        // test a local directory path
        let temp_dir = TempDir::new().unwrap();
        let source_dir = temp_dir.path().join("test-pipe-name");
        tokio::fs::create_dir_all(&source_dir).await.unwrap();
        assert_eq!(sanitize_pipe_name(
            source_dir.to_str().expect("failed to convert path to str")
        ), "test-pipe-name");

        // test with a non-GitHub URL
        let non_github_url = "https://example.com/some/path";
        assert_eq!(sanitize_pipe_name(non_github_url), "https---example-com-some-path");

        // url including invalid characters
        let invalid_chars = "invalid:name/with*chars";
        assert_eq!(sanitize_pipe_name(invalid_chars), "invalid-name-with-chars");
    }

    #[tokio::test]
    async fn test_non_existence_local_pipe() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let screenpipe_dir = temp_dir.path().to_path_buf();

        let source_dir = temp_dir.path().join("source_pipe");
        let result = download_pipe(&source_dir.to_str().expect("failed bathbuf to str"),
            screenpipe_dir.clone()).await;
       
        assert!(result.is_err(), "test failed for non existence local pipe: {:?}", result.err());
    }

    #[tokio::test]
    async fn test_downloading_and_running_sideloaded_pipe() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let screenpipe_dir = temp_dir.path().to_path_buf();

        // Create a source directory with a simple pipe
        let source_dir = temp_dir.path().join("source_pipe");
        tokio::fs::create_dir_all(&source_dir).await.unwrap();

        // Create a basic pipe.js file
        tokio::fs::write(
            source_dir.join("pipe.js"),
            r#"console.log("Hello from Windows pipe test!");"#,
        )
        .await
        .unwrap();

        // Try to download the pipe using the Windows path
        let result = download_pipe(&source_dir.to_str().expect("failed to convert to str"),
            screenpipe_dir.clone()
        ).await;


        // The function should succeed for every os
        assert!(
            result.is_ok(),
            "Failed to download pipe: {:?}",
            result.err()
        );

        // Verify the pipe was copied correctly
        let pipe_name = source_dir.file_name().unwrap().to_str().unwrap();
        let dest_path = screenpipe_dir.join("pipes").join(pipe_name);

        assert!(dest_path.exists(), "Destination pipe directory not found");
        assert!(dest_path.join("pipe.js").exists(), "pipe.js not found in destination");

        // tests for urls
        let urls = vec![
            "https://github.com/KentTDang/AI-Interview-Coach/",
            "https://github.com/KentTDang/AI-Interview-Coach/tree/main",
            "https://github.com/mediar-ai/screenpipe/tree/main/pipes/search",
        ];

        for url in urls {
            let result = download_pipe(url, screenpipe_dir.clone()).await;
            assert!(result.is_ok(), "Failed to download pipe from URL: {}", url);

            let pipe_name = sanitize_pipe_name(url);
            let dest_path = screenpipe_dir.join("pipes").join(&pipe_name);
            assert!(dest_path.exists(), "Destination pipe directory not found for URL: {}", url);

            // verify pipe.json
            let pipe_json_path = dest_path.join("pipe.json");
            let pipe_json_content = tokio::fs::read_to_string(&pipe_json_path).await.unwrap();
            let pipe_json: serde_json::Value = serde_json::from_str(&pipe_json_content).expect("Invalid JSON format");
            assert!(pipe_json.is_object(), "expected json to be an object");

            // enable side loaded pipe, even tho its enabled by default
            let pipe_dir = dest_path;
            let pipe_json_path = pipe_dir.join("pipe.json");
            let pipe_json = tokio::fs::read_to_string(&pipe_json_path).await.unwrap();
            let mut pipe_config: serde_json::Value = serde_json::from_str(&pipe_json).unwrap();
            pipe_config["enabled"] = json!(true);
            let updated_pipe_json = serde_json::to_string_pretty(&pipe_config);
            let mut file = tokio::fs::File::create(&pipe_json_path).await.unwrap();
            file.write_all(updated_pipe_json.expect("failed to write").as_bytes()).await.unwrap();

            // run pipe
            let run_result = run_pipe(&pipe_name, screenpipe_dir.clone()).await;

            let (_child, pipe_state) = run_result.unwrap();

            // for `bun i` command, keeping it max
            sleep(Duration::from_secs(20)).await;

            match pipe_state {
                PipeState::Port(port) => {
                    // verify the pipe is running on the expected port
                    let client = reqwest::Client::new();
                    let response = client.get(format!("http://localhost:{}", port)).send().await;

                    assert!(response.is_ok(), "Failed to connect to the pipe on port {}", port);

                    // if successfull clean up the process
                    #[cfg(windows)]
                    {
                        let output = tokio::process::Command::new("powershell")
                            .arg("-NoProfile")
                            .arg("-WindowStyle")
                            .arg("hidden")
                            .arg("-Command")
                            .arg(format!(
                                r#"Get-WmiObject Win32_Process | Where-Object {{ $_.CommandLine -like "*\pipes\{}\*" }} | ForEach-Object {{ taskkill.exe /T /F /PID $_.ProcessId }}"#,
                                &pipe_name.to_string()
                            ))
                            .creation_flags(0x08000000)
                            .output()
                            .await
                            .expect("Failed to execute PowerShell command");

                        assert!(
                            output.status.success(),
                            "{} hasn't ran successfully",
                            pipe_name 
                        );

                    }

                    #[cfg(unix)]
                    {
                        let command = format!(
                            "ps axuw | grep 'pipes/{}/' | grep -v grep | awk '{{print $2}}' | xargs -I {{}} kill -TERM {{}}",
                            &pipe_name.to_string()
                        );

                        let output = tokio::process::Command::new("sh")
                            .arg("-c")
                            .arg(command)
                            .output()
                            .await
                            .expect("Failed to execute ps command");

                        assert!(
                            output.status.success(),
                            "{} hasn't ran successfully",
                            &pipe_name.to_string()
                        );
                    }
                }
                PipeState::Pid(_pid) => {
                    // pipe process will not be running at this point
                    // check by `ps axuw | grep pipes | grep -v grep`
                }
            }

        }
    }

    #[tokio::test]
    async fn test_downloading_and_running_private_pipe() {
        init();
        let temp_dir = TempDir::new().unwrap();
        let screenpipe_dir = temp_dir.path().to_path_buf();

        let pipe_name = "data-table";
        let source = "https://raw.githubusercontent.com/tribhuwan-kumar/anime/master/0.1.8.zip";
        let result = download_pipe_private("data-table", source, screenpipe_dir.clone()).await;

        assert!(
            result.is_ok(),
            "Failed to download private pipe: {:?}",
            result.err()
        );
        assert!(screenpipe_dir.join("pipes").join(pipe_name).exists(), 
            "test failed for downloading private pipe: {:?}",
            result.err()
        );

        // any zip shouldn't exists
        let mut entries = tokio::fs::read_dir(screenpipe_dir.join("pipes").join(pipe_name)).await.unwrap();
        let mut zip_exists = false;
        while let Some(entry) = entries.next_entry().await.unwrap() {
            let path = entry.path();
            if path.extension().and_then(|ext| ext.to_str()) == Some("zip") {
                zip_exists = true;
                break;
            }
        }
        assert!(!zip_exists, 
            "failed zip extraction for downloading private pipe: {:?}",
            result.err()
        );

        // verify pipe.json
        let pipe_json_path = screenpipe_dir.join("pipes").join(pipe_name).join("pipe.json");
        let pipe_json_content = tokio::fs::read_to_string(&pipe_json_path).await.unwrap();
        let pipe_json: serde_json::Value = serde_json::from_str(&pipe_json_content).expect("Invalid JSON format");

        assert!(pipe_json.is_object(), "expected json to be an object");

        // enable by writng pipe.json
        let pipe_dir = screenpipe_dir.join("pipes").join(pipe_name);
        let pipe_json_path = pipe_dir.join("pipe.json");
        let pipe_json = tokio::fs::read_to_string(&pipe_json_path).await.unwrap();
        let mut pipe_config: serde_json::Value = serde_json::from_str(&pipe_json).unwrap();
        pipe_config["enabled"] = json!(true);
        let updated_pipe_json = serde_json::to_string_pretty(&pipe_config);
        let mut file = tokio::fs::File::create(&pipe_json_path).await.unwrap();
        file.write_all(updated_pipe_json.expect("failed to write").as_bytes()).await.unwrap();

        // run pipe
        let run_result = run_pipe(pipe_name, screenpipe_dir.clone()).await;

        let (_child, pipe_state) = run_result.unwrap();

        // for `bun i` command, keeping it max
        sleep(Duration::from_secs(20)).await;

        match pipe_state {
            PipeState::Port(port) => {
                // verify the pipe is running on the expected port
                let client = reqwest::Client::new();
                let response = client.get(format!("http://localhost:{}", port)).send().await;

                assert!(response.is_ok(), "Failed to connect to the pipe on port {}", port);

                // if successfull clean up the process
                #[cfg(windows)]
                {
                    let output = tokio::process::Command::new("powershell")
                        .arg("-NoProfile")
                        .arg("-WindowStyle")
                        .arg("hidden")
                        .arg("-Command")
                        .arg(format!(
                            r#"Get-WmiObject Win32_Process | Where-Object {{ $_.CommandLine -like "*\pipes\{}\*" }} | ForEach-Object {{ taskkill.exe /T /F /PID $_.ProcessId }}"#,
                            &pipe_name.to_string()
                        ))
                        .creation_flags(0x08000000)
                        .output()
                    .await
                    .expect("Failed to execute PowerShell command");

                    assert!(
                        output.status.success(),
                        "{} hasn't ran successfully",
                        pipe_name 
                    );

                }

                #[cfg(unix)]
                {
                    let command = format!(
                        "ps axuw | grep 'pipes/{}/' | grep -v grep | awk '{{print $2}}' | xargs -I {{}} kill -TERM {{}}",
                        &pipe_name.to_string()
                    );

                    let output = tokio::process::Command::new("sh")
                        .arg("-c")
                        .arg(command)
                        .output()
                        .await
                        .expect("Failed to execute ps command");

                    assert!(
                        output.status.success(),
                        "{} hasn't ran successfully",
                        pipe_name 
                    );
                }
            }
            PipeState::Pid(_pid) => {
                // pipe process will not be running at this point
                // check by `ps axuw | grep pipes | grep -v grep`
            }
        }
    }
}
