# Deployment Guide: BookTracker on AWS EC2

This guide will help you deploy your BookTracker application to AWS EC2 using GitHub Actions for automated deployments.

## Prerequisites

- AWS Account
- GitHub repository with your BookTracker code
- Domain name (optional, for custom domain)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance Type: **t2.micro** (free tier) or **t3.small** for better performance
4. Configure Security Group:
   - SSH (Port 22) from your IP
   - HTTP (Port 80) from anywhere
   - HTTPS (Port 443) from anywhere
   - Custom TCP (Port 3000) from anywhere (for your app)

### 1.2 Connect to Instance
```bash
# Download your .pem key file and set permissions
chmod 400 your-key.pem

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Set Up EC2 Server

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
# SSH back in
```

### 2.3 Install Git
```bash
sudo apt install git -y
```

### 2.4 Clone Your Repository
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/booktracker.git
cd booktracker
```

### 2.5 Set Up Environment Variables
```bash
# Create .env file with your production environment variables
nano .env
```

Add your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2.6 Test Initial Deployment
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run initial deployment
./deploy.sh
```

## Step 3: Set Up GitHub Actions

### 3.1 Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `EC2_HOST`: Your EC2 public IP address
- `EC2_USERNAME`: `ubuntu`
- `EC2_SSH_KEY`: Your private key content (the .pem file content)

### 3.2 Test GitHub Actions
1. Push a small change to your main branch
2. Go to Actions tab in GitHub
3. Watch the deployment workflow run

## Step 4: Set Up Domain and SSL (Optional)

### 4.1 Install Nginx
```bash
sudo apt install nginx -y
```

### 4.2 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/booktracker
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/booktracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4 Install SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 5: Monitoring and Maintenance

### 5.1 Check Application Status
```bash
# Check if containers are running
docker ps

# Check logs
docker-compose logs -f

# Check application health
curl http://localhost:3000/api/health
```

### 5.2 Manual Deployment (if needed)
```bash
cd /home/ubuntu/booktracker
./deploy.sh
```

### 5.3 Update Application
Simply push to your main branch:
```bash
git add .
git commit -m "Update message"
git push origin main
```

GitHub Actions will automatically deploy the changes!

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible**: Check security group settings
2. **Docker permission denied**: Make sure user is in docker group
3. **Build fails**: Check Docker logs with `docker-compose logs`
4. **Environment variables missing**: Ensure .env file exists on EC2

### Useful Commands:
```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop
```

## Security Notes

- Keep your .pem key file secure
- Regularly update your EC2 instance
- Use strong passwords and SSH keys
- Consider setting up a firewall (UFW)
- Monitor your AWS costs

## Cost Optimization

- Use t2.micro for development (free tier)
- Consider reserved instances for production
- Monitor CloudWatch metrics
- Set up billing alerts

Your BookTracker app is now deployed and will automatically update whenever you push to the main branch! 🎉 