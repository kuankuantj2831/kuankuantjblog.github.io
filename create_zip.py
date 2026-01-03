import zipfile
import os
import stat

def zip_server_folder():
    source_dir = 'server'
    output_filename = 'server_upload_tencent_cloud/deploy_package.zip'
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Add all files from server/ directory
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                # We include node_modules now!
                # if 'node_modules' in root:
                #     continue
                if file == 'scf_bootstrap': 
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                print(f'Adding {arcname}...')
                zipf.write(file_path, arcname)
        
        # 2. Add scf_bootstrap manually with Unix line endings (\n) and permissions
        print('Adding scf_bootstrap with Unix line endings...')
        # Simple bootstrap, no npm install needed
        bootstrap_content = "#!/bin/bash\nexport PATH=/var/lang/node20/bin:$PATH\nnode app.js\n"
        
        zi = zipfile.ZipInfo('scf_bootstrap')
        zi.external_attr = 0o755 << 16 # rwxr-xr-x
        zi.create_system = 3 # Unix
        
        zipf.writestr(zi, bootstrap_content.encode('utf-8'))
                
    print(f'Successfully created {output_filename}')

if __name__ == '__main__':
    zip_server_folder()
