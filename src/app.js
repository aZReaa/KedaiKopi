document.addEventListener("alpine:init", () => {
  Alpine.data("products", () => ({
    items: [
      { id: 1, name: "Coorg Arabica Roasted", img: "1.jpg", price: 45000 },
      { id: 2, name: "Premium Coffee Beans", img: "2.jpg", price: 38000 },
      { id: 3, name: "Robusta Coffee 250gr", img: "3.jpg", price: 32000 },
      { id: 4, name: "Ethiopian Single Origin", img: "4.jpg", price: 52000 },
      { id: 5, name: "Dark Roast Specialty", img: "5.jpg", price: 48000 },
    ],
  }));

  Alpine.data("checkout", () => ({
    customer: {
      name: '',
      email: '',
      phone: ''
    },
    loading: false,
    
    async processPayment() {
      this.loading = true;
      
      try {
        // Validasi form
        if (!this.customer.name || !this.customer.email || !this.customer.phone) {
          alert('Mohon lengkapi semua data customer!');
          return;
        }
        
        // Validasi cart
        if (this.$store.cart.items.length === 0) {
          alert('Cart masih kosong!');
          return;
        }
        
        // Prepare data untuk dikirim ke backend
        const orderData = {
          customer: this.customer,
          items: this.$store.cart.items,
          total: this.$store.cart.total
        };
        
        // Kirim request ke placeorder.php
        const response = await fetch('placeorder.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData)
        });
        
        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Terjadi kesalahan saat memproses pesanan');
        }
        
        // Buka Midtrans Snap
        window.snap.pay(result.snap_token, {
          onSuccess: (result) => {
            alert('Pembayaran berhasil!');
            console.log('Payment success:', result);
            
            // Reset form dan cart
            this.customer = { name: '', email: '', phone: '' };
            this.$store.cart.items = [];
            this.$store.cart.total = 0;
            this.$store.cart.quantity = 0;
          },
          onPending: (result) => {
            alert('Menunggu pembayaran...');
            console.log('Payment pending:', result);
          },
          onError: (result) => {
            alert('Pembayaran gagal!');
            console.log('Payment error:', result);
          },
          onClose: () => {
            console.log('Payment popup closed');
          }
        });
        
      } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }));

  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,
    add(newItem) {
      // cek apakah ada barang yang sama di cart
      const cartItem = this.items.find((item) => item.id === newItem.id);

      //jika belum ada / cart masish kosong
      if (!cartItem) {
        this.items.push({ ...newItem, quantity: 1, total: newItem.price });
        this.quantity++;
        this.total += newItem.price;
      } else {
        //jika barang nya sudah ada, cek apakah barang beda atau sama dengan yang ada di cart
        this.items = this.items.map((item) => {
          //jika barang berbeda
          if (item.id !== newItem.id) {
            return item;
          } else {
            //jika barang sudah ada, tambah quantity dan totalnya
            item.quantity++;
            item.total = item.price * item.quantity;
            this.quantity++;
            this.total += item.price;
            return item;
          }
        });
      }

     
    },
    remove(id) {
      // ambil item yang mau di remove berdasarkan id nya
      const cartItem = this.items.find((item) => item.id === id);

      // jika item lebih dari 1
      if(cartItem.quantity > 1) {
        // telusuri 1 1
        this.items = this.items.map((item) =>{
          // jika bukan barang yang diklik
          if(item.id !== id) {
            return item;
          } else {
            item.quantity--;
            item.total = item.price * item.quantity;
            this.quantity--;
            this.total -= item.price;
            return item;
          }
        })
      } else if (cartItem.quantity === 1) {
        // jika barangnya sisa 1
        this.items = this.items.filter((item) =>item.id !== id);
        this.quantity--;
        this.total -= cartItem.price;
      }
    }
  });
});

//Konversi ke Rupiah
const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};