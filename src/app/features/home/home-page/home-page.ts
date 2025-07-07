import { Component, inject, NgZone } from '@angular/core';
import { BeneficiaryService } from '../../../core/services/beneficiary/beneficiary.service';
import { Loading } from '../../../shared/components/loading/loading';

declare const API_URL: string;

@Component({
  imports: [Loading],
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  public isLoading = false;

  public uploadProgress = 0;
  public uploadVisible = false;

  private readonly ngZone = inject(NgZone);
  private readonly beneficiaryService = inject(BeneficiaryService);

  public async onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadVisible = true;
    this.uploadProgress = 0;

    const worker = new Worker(
      new URL('../../../core/workers/line-parser.worker', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = async ({ data }) => {
      if (data.type == 'progress')
        return this.ngZone.run(() => (this.uploadProgress = data.value));
      if (data.type == 'done') {
        alert('Beneficiários adicionados com sucesso');
        input.value = '';
        this.ngZone.run(() => (this.uploadVisible = false));
        worker.terminate();
      }
    };

    worker.postMessage(file);
  }

  public downloadFile() {
    const form = document.createElement('form');
    form.style.display = 'none';
    form.action = `${API_URL}/beneficiary`;
    form.method = 'GET';
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  public reset(): void {
    this.isLoading = true;
    this.beneficiaryService.reset().subscribe({
      next: ({ message }) => {
        this.isLoading = false;
        alert(message);
      },
    });
  }
}
